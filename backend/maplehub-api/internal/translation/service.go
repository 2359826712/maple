package translation

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"maplehub/internal/repo"
)

const (
	maxTexts        = 50
	maxRequestSize  = 100 * 1024
	maxResponseSize = 2 * 1024 * 1024
)

var targetLanguageCodes = map[string]string{
	"en": "EN-US", "zh": "ZH-HANS", "zh-Hant": "ZH-HANT", "ja": "JA", "ko": "KO",
}

var sourceLanguageCodes = map[string]string{
	"en": "EN", "zh": "ZH", "zh-Hant": "ZH", "ja": "JA", "ko": "KO",
}

type Request struct {
	Texts          []string `json:"texts"`
	TargetLanguage string   `json:"target_language"`
	SourceLanguage string   `json:"source_language,omitempty"`
	Format         string   `json:"format,omitempty"`
}

type Response struct {
	Translations []string `json:"translations"`
	Cached       bool     `json:"cached"`
}

type deepLRequest struct {
	Texts              []string `json:"text"`
	TargetLanguage     string   `json:"target_lang"`
	SourceLanguage     string   `json:"source_lang,omitempty"`
	TagHandling        string   `json:"tag_handling,omitempty"`
	PreserveFormatting bool     `json:"preserve_formatting"`
	ModelType          string   `json:"model_type"`
}

type deepLResponse struct {
	Translations []struct {
		DetectedSourceLanguage string `json:"detected_source_language"`
		Text                   string `json:"text"`
	} `json:"translations"`
}

type Options struct {
	Provider             string
	DeepLAuthKey         string
	DeepLAPIURL          string
	LibreTranslateAPIURL string
	LibreTranslateAPIKey string
	OllamaAPIURL         string
	OllamaModel          string
}

type Service struct {
	Repo                 repo.TranslationRepo
	Provider             string
	AuthKey              string
	APIURL               string
	LibreTranslateAPIURL string
	LibreTranslateAPIKey string
	OllamaAPIURL         string
	OllamaModel          string
	Client               *http.Client
	mu                   sync.Mutex
	pendingMu            sync.Mutex
	pending              map[string]repo.TranslationRecord
	memory               map[string]repo.TranslationRecord
	persisting           bool
}

func New(repository repo.TranslationRepo, options Options) *Service {
	provider := strings.ToLower(strings.TrimSpace(options.Provider))
	if provider == "" {
		provider = "deepl"
	}
	deepLURL := strings.TrimSpace(options.DeepLAPIURL)
	if deepLURL == "" {
		deepLURL = "https://api-free.deepl.com/v2/translate"
	}
	libreTranslateURL := strings.TrimSpace(options.LibreTranslateAPIURL)
	if libreTranslateURL == "" {
		libreTranslateURL = "http://127.0.0.1:5000/translate"
	}
	ollamaURL := strings.TrimSpace(options.OllamaAPIURL)
	if ollamaURL == "" {
		ollamaURL = "http://127.0.0.1:11434"
	}
	ollamaModel := strings.TrimSpace(options.OllamaModel)
	if ollamaModel == "" {
		ollamaModel = "gemma3:1b"
	}
	return &Service{
		Repo: repository, Provider: provider, AuthKey: strings.TrimSpace(options.DeepLAuthKey), APIURL: deepLURL,
		LibreTranslateAPIURL: libreTranslateURL, LibreTranslateAPIKey: strings.TrimSpace(options.LibreTranslateAPIKey),
		OllamaAPIURL: ollamaURL, OllamaModel: ollamaModel, Client: &http.Client{Timeout: 5 * time.Minute},
		pending: make(map[string]repo.TranslationRecord), memory: make(map[string]repo.TranslationRecord),
	}
}

func (s *Service) requireProviderConfigured() error {
	switch s.Provider {
	case "deepl":
		if s.AuthKey == "" {
			return errors.New("DeepL translation provider is not configured")
		}
	case "libretranslate", "ollama":
	default:
		return fmt.Errorf("unsupported translation provider %q", s.Provider)
	}
	return nil
}

func (s *Service) fetchProvider(ctx context.Context, request Request, texts []string) ([]string, []string, string, error) {
	switch s.Provider {
	case "deepl":
		translated, detected, err := s.fetchDeepL(ctx, request, texts)
		return translated, detected, "deepl", err
	case "libretranslate":
		translated, detected, err := s.fetchLibreTranslate(ctx, request, texts)
		return translated, detected, "libretranslate", err
	case "ollama":
		translated, detected, err := s.fetchOllama(ctx, request, texts)
		return translated, detected, "ollama:" + s.OllamaModel, err
	default:
		return nil, nil, "", fmt.Errorf("unsupported translation provider %q", s.Provider)
	}
}

func normalizeRequest(request Request) (Request, error) {
	request.TargetLanguage = normalizeLocale(request.TargetLanguage)
	request.SourceLanguage = normalizeLocale(request.SourceLanguage)
	request.Format = strings.ToLower(strings.TrimSpace(request.Format))
	if request.Format == "" {
		request.Format = "text"
	}
	if _, ok := targetLanguageCodes[request.TargetLanguage]; !ok {
		return Request{}, errors.New("unsupported target language")
	}
	if request.SourceLanguage != "" {
		if _, ok := sourceLanguageCodes[request.SourceLanguage]; !ok {
			return Request{}, errors.New("unsupported source language")
		}
	}
	if request.Format != "text" && request.Format != "html" {
		return Request{}, errors.New("translation format must be text or html")
	}
	if len(request.Texts) == 0 || len(request.Texts) > maxTexts {
		return Request{}, fmt.Errorf("translation request must contain 1 to %d texts", maxTexts)
	}
	totalBytes := 0
	for index, text := range request.Texts {
		request.Texts[index] = strings.TrimSpace(text)
		totalBytes += len(request.Texts[index])
	}
	if totalBytes > maxRequestSize {
		return Request{}, errors.New("translation request exceeds 100 KB")
	}
	return request, nil
}

func normalizeLocale(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	switch {
	case strings.HasPrefix(normalized, "zh-hant"), strings.HasPrefix(normalized, "zh-tw"), strings.HasPrefix(normalized, "zh-hk"):
		return "zh-Hant"
	case strings.HasPrefix(normalized, "zh"):
		return "zh"
	case strings.HasPrefix(normalized, "ja"):
		return "ja"
	case strings.HasPrefix(normalized, "ko"):
		return "ko"
	case strings.HasPrefix(normalized, "en"):
		return "en"
	default:
		return ""
	}
}

func sourceHash(sourceLanguage, text string) string {
	sum := sha256.Sum256([]byte(sourceLanguage + "\x00" + text))
	return hex.EncodeToString(sum[:])
}

func translationRecordKey(sourceHash, targetLanguage, contentFormat string) string {
	return sourceHash + "\x00" + targetLanguage + "\x00" + contentFormat
}

func (s *Service) queuePersistence(records []repo.TranslationRecord) {
	s.pendingMu.Lock()
	for _, record := range records {
		key := translationRecordKey(record.SourceHash, record.TargetLanguage, record.ContentFormat)
		s.pending[key] = record
		s.memory[key] = record
	}
	if s.persisting {
		s.pendingMu.Unlock()
		return
	}
	s.persisting = true
	s.pendingMu.Unlock()
	go s.persistLoop()
}

func (s *Service) persistLoop() {
	for {
		s.pendingMu.Lock()
		batch := make([]repo.TranslationRecord, 0, 40)
		for _, record := range s.pending {
			batch = append(batch, record)
			if len(batch) == 40 {
				break
			}
		}
		if len(batch) == 0 {
			s.persisting = false
			s.pendingMu.Unlock()
			return
		}
		s.pendingMu.Unlock()

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		err := s.Repo.UpsertMany(ctx, batch)
		cancel()
		if err != nil {
			time.Sleep(15 * time.Second)
			continue
		}

		s.pendingMu.Lock()
		for _, record := range batch {
			key := translationRecordKey(record.SourceHash, record.TargetLanguage, record.ContentFormat)
			if current, ok := s.pending[key]; ok && current.TranslatedText == record.TranslatedText {
				delete(s.pending, key)
			}
		}
		s.pendingMu.Unlock()
	}
}

func (s *Service) lookupCached(
	ctx context.Context,
	hashes []string,
	targetLanguage string,
	contentFormat string,
) map[string]repo.TranslationRecord {
	cached := make(map[string]repo.TranslationRecord, len(hashes))
	s.pendingMu.Lock()
	for _, hash := range hashes {
		if item, ok := s.memory[translationRecordKey(hash, targetLanguage, contentFormat)]; ok {
			cached[hash] = item
		}
	}
	s.pendingMu.Unlock()

	missingHashes := make([]string, 0, len(hashes)-len(cached))
	for _, hash := range hashes {
		if _, ok := cached[hash]; !ok {
			missingHashes = append(missingHashes, hash)
		}
	}
	if len(missingHashes) == 0 {
		return cached
	}

	cacheCtx, cacheCancel := context.WithTimeout(ctx, 10*time.Second)
	databaseCached, err := s.Repo.GetMany(cacheCtx, missingHashes, targetLanguage, contentFormat)
	cacheCancel()
	if err != nil {
		return cached
	}
	s.pendingMu.Lock()
	for hash, item := range databaseCached {
		cached[hash] = item
		s.memory[translationRecordKey(hash, targetLanguage, contentFormat)] = item
	}
	s.pendingMu.Unlock()
	return cached
}

func resolveCachedTranslations(
	texts []string,
	hashes []string,
	cached map[string]repo.TranslationRecord,
) ([]string, []int, []string) {
	translations := make([]string, len(texts))
	missingIndexes := make([]int, 0)
	missingTexts := make([]string, 0)
	for index, hash := range hashes {
		if texts[index] == "" {
			translations[index] = ""
			continue
		}
		if item, ok := cached[hash]; ok {
			translations[index] = item.TranslatedText
			continue
		}
		missingIndexes = append(missingIndexes, index)
		missingTexts = append(missingTexts, texts[index])
	}
	return translations, missingIndexes, missingTexts
}

func (s *Service) Translate(ctx context.Context, rawRequest Request) (Response, error) {
	request, err := normalizeRequest(rawRequest)
	if err != nil {
		return Response{}, err
	}
	if request.SourceLanguage != "" && request.SourceLanguage == request.TargetLanguage {
		return Response{Translations: append([]string(nil), request.Texts...), Cached: true}, nil
	}
	if err := s.requireProviderConfigured(); err != nil {
		return Response{}, err
	}

	hashes := make([]string, len(request.Texts))
	for index, text := range request.Texts {
		hashes[index] = sourceHash(request.SourceLanguage, text)
	}
	cached := s.lookupCached(ctx, hashes, request.TargetLanguage, request.Format)
	translations, missingIndexes, missingTexts := resolveCachedTranslations(request.Texts, hashes, cached)
	if len(missingTexts) == 0 {
		return Response{Translations: translations, Cached: true}, nil
	}

	// Only cache misses are serialized. Already materialized language snapshots
	// can now be read concurrently when a page switches language.
	s.mu.Lock()
	defer s.mu.Unlock()
	cached = s.lookupCached(ctx, hashes, request.TargetLanguage, request.Format)
	translations, missingIndexes, missingTexts = resolveCachedTranslations(request.Texts, hashes, cached)
	if len(missingTexts) == 0 {
		return Response{Translations: translations, Cached: true}, nil
	}

	translated, detected, provider, err := s.fetchProvider(ctx, request, missingTexts)
	if err != nil {
		return Response{}, err
	}
	records := make([]repo.TranslationRecord, 0, len(missingIndexes))
	for resultIndex, originalIndex := range missingIndexes {
		translations[originalIndex] = translated[resultIndex]
		records = append(records, repo.TranslationRecord{
			SourceHash: hashes[originalIndex], TargetLanguage: request.TargetLanguage,
			ContentFormat: request.Format, SourceText: request.Texts[originalIndex],
			TranslatedText: translated[resultIndex], DetectedSourceLanguage: detected[resultIndex],
			Provider: provider,
		})
	}
	s.queuePersistence(records)
	return Response{Translations: translations, Cached: false}, nil
}

func (s *Service) fetchDeepL(ctx context.Context, request Request, texts []string) ([]string, []string, error) {
	endpoint, err := url.Parse(s.APIURL)
	if err != nil || endpoint.Scheme != "https" || (endpoint.Hostname() != "api-free.deepl.com" && endpoint.Hostname() != "api.deepl.com") {
		return nil, nil, errors.New("invalid DeepL API URL")
	}
	payload := deepLRequest{
		Texts: texts, TargetLanguage: targetLanguageCodes[request.TargetLanguage],
		PreserveFormatting: true, ModelType: "prefer_quality_optimized",
	}
	if request.SourceLanguage != "" {
		payload.SourceLanguage = sourceLanguageCodes[request.SourceLanguage]
	}
	if request.Format == "html" {
		payload.TagHandling = "html"
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, nil, err
	}
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint.String(), bytes.NewReader(body))
	if err != nil {
		return nil, nil, err
	}
	httpRequest.Header.Set("Authorization", "DeepL-Auth-Key "+s.AuthKey)
	httpRequest.Header.Set("Content-Type", "application/json")
	httpRequest.Header.Set("User-Agent", "MapleHubTranslation/1.0")
	response, err := s.Client.Do(httpRequest)
	if err != nil {
		return nil, nil, err
	}
	defer response.Body.Close()
	responseBody, err := io.ReadAll(io.LimitReader(response.Body, maxResponseSize+1))
	if err != nil {
		return nil, nil, err
	}
	if len(responseBody) > maxResponseSize {
		return nil, nil, errors.New("DeepL response exceeds 2 MB")
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, nil, fmt.Errorf("DeepL returned status %d", response.StatusCode)
	}
	var parsed deepLResponse
	if err := json.Unmarshal(responseBody, &parsed); err != nil {
		return nil, nil, err
	}
	if len(parsed.Translations) != len(texts) {
		return nil, nil, errors.New("DeepL returned an unexpected translation count")
	}
	translated := make([]string, len(parsed.Translations))
	detected := make([]string, len(parsed.Translations))
	for index, item := range parsed.Translations {
		translated[index] = item.Text
		detected[index] = item.DetectedSourceLanguage
	}
	return translated, detected, nil
}
