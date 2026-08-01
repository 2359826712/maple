package staticcontent

import (
	"bytes"
	"context"
	"crypto/sha256"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"maplehub/internal/netsecurity"
	"maplehub/internal/repo"
)

const (
	RefreshInterval = 12 * time.Hour
	RetryInterval   = 15 * time.Minute
	maxResponseSize = 5 * 1024 * 1024
)

var allowedHosts = map[string]struct{}{
	"g.nexonstatic.com":                              {},
	"grandislibrary.com":                             {},
	"gucciguild.com":                                 {},
	"maplestory.beanfun.com":                         {},
	"maplestory-event.beanfun.com":                   {},
	"maplestory.io":                                  {},
	"maplestory.nexon.co.jp":                         {},
	"maplestory.nexon.com":                           {},
	"maplestorywiki.net":                             {},
	"public-api.wordpress.com":                       {},
	"r.jina.ai":                                      {},
	"v66rewn65j.execute-api.us-west-2.amazonaws.com": {},
	"www.grandislibrary.com":                         {},
	"www.maplesea.com":                               {},
	"www.nexon.com":                                  {},
}

type Request struct {
	URL     string            `json:"url"`
	Method  string            `json:"method,omitempty"`
	Headers map[string]string `json:"headers,omitempty"`
	Body    []byte            `json:"body,omitempty"`
}

type Service struct {
	Repo repo.StaticContentRepo

	mu         sync.Mutex
	inFlight   map[string]*refreshCall
	adapters   map[string]Adapter
	memory     map[string]repo.StaticContentSnapshot
	pending    map[string]repo.StaticContentInput
	persisting map[string]bool
}

type Adapter func(context.Context, Request) ([]byte, string, int, error)

type refreshCall struct {
	done     chan struct{}
	snapshot repo.StaticContentSnapshot
	err      error
}

func New(repository repo.StaticContentRepo) *Service {
	return &Service{
		Repo: repository, inFlight: make(map[string]*refreshCall), adapters: make(map[string]Adapter),
		memory: make(map[string]repo.StaticContentSnapshot), pending: make(map[string]repo.StaticContentInput),
		persisting: make(map[string]bool),
	}
}

func (s *Service) RegisterAdapter(name string, adapter Adapter) {
	s.mu.Lock()
	s.adapters[name] = adapter
	s.mu.Unlock()
}

func normalizeRequest(request Request) (Request, error) {
	request.URL = strings.TrimSpace(request.URL)
	request.Method = strings.ToUpper(strings.TrimSpace(request.Method))
	if request.Method == "" {
		request.Method = http.MethodGet
	}
	if request.Method != http.MethodGet && request.Method != http.MethodPost {
		return Request{}, errors.New("only GET and POST static content requests are allowed")
	}
	if len(request.Body) > 256*1024 {
		return Request{}, errors.New("static content request body exceeds 256 KB")
	}
	if err := netsecurity.ValidateHTTPSURL(request.URL, allowedHosts); err != nil {
		return Request{}, err
	}

	filteredHeaders := make(map[string]string)
	for name, value := range request.Headers {
		switch http.CanonicalHeaderKey(name) {
		case "Accept", "Content-Type", "Referer", "X-Requested-With":
			if len(value) <= 500 {
				filteredHeaders[http.CanonicalHeaderKey(name)] = value
			}
		}
	}
	request.Headers = filteredHeaders
	return request, nil
}

func CacheKey(request Request) string {
	headers, _ := json.Marshal(request.Headers)
	sum := sha256.Sum256(bytes.Join([][]byte{
		[]byte(request.Method), []byte(request.URL), headers, request.Body,
	}, []byte{0}))
	return "static:" + hex.EncodeToString(sum[:])
}

func requestFromSnapshot(snapshot repo.StaticContentSnapshot) (Request, error) {
	headers := make(map[string]string)
	if len(snapshot.RequestHeaders) > 0 {
		if err := json.Unmarshal(snapshot.RequestHeaders, &headers); err != nil {
			return Request{}, err
		}
	}
	request := Request{
		URL: snapshot.SourceURL, Method: snapshot.RequestMethod,
		Headers: headers, Body: snapshot.RequestBody,
	}
	if strings.HasPrefix(request.Method, "ADAPTER:") {
		if err := netsecurity.ValidateHTTPSURL(request.URL, allowedHosts); err != nil {
			return Request{}, err
		}
		return request, nil
	}
	return normalizeRequest(request)
}

func (s *Service) Get(ctx context.Context, rawRequest Request) (repo.StaticContentSnapshot, error) {
	request, err := normalizeRequest(rawRequest)
	if err != nil {
		return repo.StaticContentSnapshot{}, err
	}
	return s.getNormalized(ctx, request)
}

func (s *Service) GetAdapter(ctx context.Context, name, rawURL string) (repo.StaticContentSnapshot, error) {
	if strings.TrimSpace(name) == "" {
		return repo.StaticContentSnapshot{}, errors.New("static content adapter name is required")
	}
	if err := netsecurity.ValidateHTTPSURL(rawURL, allowedHosts); err != nil {
		return repo.StaticContentSnapshot{}, err
	}
	s.mu.Lock()
	_, registered := s.adapters[name]
	s.mu.Unlock()
	if !registered {
		return repo.StaticContentSnapshot{}, errors.New("static content adapter is not registered")
	}
	return s.getNormalized(ctx, Request{URL: rawURL, Method: "ADAPTER:" + name})
}

func (s *Service) getNormalized(ctx context.Context, request Request) (repo.StaticContentSnapshot, error) {
	cacheKey := CacheKey(request)
	now := time.Now()
	s.mu.Lock()
	memorySnapshot, memoryFound := s.memory[cacheKey]
	s.mu.Unlock()
	if memoryFound && now.Before(memorySnapshot.RefreshAfter) {
		return memorySnapshot, nil
	}

	dbCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
	snapshot, getErr := s.Repo.Get(dbCtx, cacheKey)
	cancel()
	if getErr == nil {
		s.remember(snapshot)
		if now.Before(snapshot.RefreshAfter) {
			return snapshot, nil
		}
		go func() {
			refreshCtx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
			defer cancel()
			_, _ = s.refresh(refreshCtx, request)
		}()
		return snapshot, nil
	}
	if memoryFound {
		go func() {
			refreshCtx, refreshCancel := context.WithTimeout(context.Background(), 45*time.Second)
			defer refreshCancel()
			_, _ = s.refresh(refreshCtx, request)
		}()
		return memorySnapshot, nil
	}
	return s.refresh(ctx, request)
}

func (s *Service) remember(snapshot repo.StaticContentSnapshot) {
	s.mu.Lock()
	s.memory[snapshot.CacheKey] = snapshot
	s.mu.Unlock()
}

func snapshotFromInput(input repo.StaticContentInput, syncedAt time.Time) repo.StaticContentSnapshot {
	return repo.StaticContentSnapshot{
		CacheKey: input.CacheKey, SourceURL: input.SourceURL, RequestMethod: input.RequestMethod,
		RequestHeaders: input.RequestHeaders, RequestBody: input.RequestBody, ResponseBody: input.ResponseBody,
		ContentType: input.ContentType, StatusCode: input.StatusCode, SyncedAt: syncedAt,
		RefreshAfter: input.RefreshAfter, LastAttemptAt: syncedAt, CreatedAt: syncedAt, UpdatedAt: syncedAt,
	}
}

func (s *Service) refresh(ctx context.Context, request Request) (repo.StaticContentSnapshot, error) {
	cacheKey := CacheKey(request)
	s.mu.Lock()
	if existing := s.inFlight[cacheKey]; existing != nil {
		s.mu.Unlock()
		select {
		case <-ctx.Done():
			return repo.StaticContentSnapshot{}, ctx.Err()
		case <-existing.done:
			return existing.snapshot, existing.err
		}
	}
	call := &refreshCall{done: make(chan struct{})}
	s.inFlight[cacheKey] = call
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.inFlight, cacheKey)
		close(call.done)
		s.mu.Unlock()
	}()

	body, contentType, statusCode, fetchErr := s.fetch(ctx, request)
	if fetchErr != nil {
		_ = s.Repo.MarkFailure(ctx, cacheKey, time.Now().Add(RetryInterval), fetchErr.Error())
		call.err = fetchErr
		return repo.StaticContentSnapshot{}, fetchErr
	}
	headers, _ := json.Marshal(request.Headers)
	input := repo.StaticContentInput{
		CacheKey: cacheKey, SourceURL: request.URL, RequestMethod: request.Method,
		RequestHeaders: headers, RequestBody: request.Body, ResponseBody: body,
		ContentType: contentType, StatusCode: statusCode,
		RefreshAfter: time.Now().Add(RefreshInterval),
	}
	call.snapshot = snapshotFromInput(input, time.Now())
	s.remember(call.snapshot)
	s.queuePersist(cacheKey, input)
	return call.snapshot, call.err
}

func (s *Service) queuePersist(cacheKey string, input repo.StaticContentInput) {
	s.mu.Lock()
	s.pending[cacheKey] = input
	s.mu.Unlock()
	go s.persistPending(context.Background(), cacheKey)
}

func (s *Service) persistPending(ctx context.Context, cacheKey string) {
	s.mu.Lock()
	input, found := s.pending[cacheKey]
	if !found || s.persisting[cacheKey] {
		s.mu.Unlock()
		return
	}
	s.persisting[cacheKey] = true
	s.mu.Unlock()

	persistCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	snapshot, err := s.Repo.Upsert(persistCtx, input)
	cancel()

	s.mu.Lock()
	delete(s.persisting, cacheKey)
	if err == nil {
		s.memory[cacheKey] = snapshot
		if current, exists := s.pending[cacheKey]; exists && current.RefreshAfter.Equal(input.RefreshAfter) {
			delete(s.pending, cacheKey)
		}
	}
	s.mu.Unlock()
}

func (s *Service) persistQueued(ctx context.Context, limit int) {
	s.mu.Lock()
	keys := make([]string, 0, min(limit, len(s.pending)))
	for key := range s.pending {
		keys = append(keys, key)
		if len(keys) >= limit {
			break
		}
	}
	s.mu.Unlock()
	for _, key := range keys {
		go s.persistPending(ctx, key)
	}
}

func (s *Service) fetch(ctx context.Context, request Request) ([]byte, string, int, error) {
	if strings.HasPrefix(request.Method, "ADAPTER:") {
		name := strings.TrimPrefix(request.Method, "ADAPTER:")
		s.mu.Lock()
		adapter := s.adapters[name]
		s.mu.Unlock()
		if adapter == nil {
			return nil, "", 0, errors.New("static content adapter is not registered")
		}
		return adapter(ctx, request)
	}
	parsed, _ := url.Parse(request.URL)
	client := safeClient(parsed.Hostname(), 35*time.Second)
	httpRequest, err := http.NewRequestWithContext(ctx, request.Method, request.URL, bytes.NewReader(request.Body))
	if err != nil {
		return nil, "", 0, err
	}
	httpRequest.Header.Set("User-Agent", "MapleHubStaticMirror/1.0")
	httpRequest.Header.Set("Accept", "application/json,text/html,application/xhtml+xml,text/plain,*/*")
	for name, value := range request.Headers {
		httpRequest.Header.Set(name, value)
	}
	response, err := client.Do(httpRequest)
	if err != nil {
		return nil, "", 0, err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, "", response.StatusCode, fmt.Errorf("static source returned status %d", response.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, maxResponseSize+1))
	if err != nil {
		return nil, "", response.StatusCode, err
	}
	if len(body) > maxResponseSize {
		return nil, "", response.StatusCode, errors.New("static source response exceeded 5 MB")
	}
	contentType := response.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(body)
	}
	return body, contentType, response.StatusCode, nil
}

func safeClient(host string, timeout time.Duration) *http.Client {
	if os.Getenv("HTTPS_PROXY") == "" && os.Getenv("https_proxy") == "" {
		return netsecurity.NewSafeHTTPClient([]string{host}, timeout)
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = http.ProxyFromEnvironment
	transport.TLSClientConfig = &tls.Config{MinVersion: tls.VersionTLS12}
	return &http.Client{
		Timeout: timeout, Transport: transport,
		CheckRedirect: func(request *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			return netsecurity.ValidateHTTPSURL(request.URL.String(), allowedHosts)
		},
	}
}

func (s *Service) RefreshDue(ctx context.Context, limit int) error {
	snapshots, err := s.Repo.ListDue(ctx, limit)
	if err != nil {
		return err
	}
	var wait sync.WaitGroup
	workers := make(chan struct{}, 3)
	for _, snapshot := range snapshots {
		snapshot := snapshot
		wait.Add(1)
		go func() {
			defer wait.Done()
			select {
			case <-ctx.Done():
				return
			case workers <- struct{}{}:
			}
			defer func() { <-workers }()

			request, requestErr := requestFromSnapshot(snapshot)
			if requestErr != nil {
				_ = s.Repo.MarkFailure(ctx, snapshot.CacheKey, time.Now().Add(RetryInterval), requestErr.Error())
				return
			}
			refreshCtx, cancel := context.WithTimeout(ctx, 45*time.Second)
			defer cancel()
			_, _ = s.refresh(refreshCtx, request)
		}()
	}
	wait.Wait()
	return nil
}

func (s *Service) Run(ctx context.Context) {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.persistQueued(ctx, 10)
			_ = s.RefreshDue(ctx, 50)
		}
	}
}
