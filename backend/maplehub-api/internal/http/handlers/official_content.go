package handlers

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/netsecurity"
	"maplehub/internal/staticcontent"
)

const officialContentLimit = 5 * 1024 * 1024

const officialBrowserUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"

var antiforgeryTokenPattern = regexp.MustCompile(`name="__RequestVerificationToken"[^>]+value="([^"]+)"`)

type OfficialContentHandler struct {
	Snapshots *staticcontent.Service
}

func NewOfficialContentHandler(snapshots *staticcontent.Service) OfficialContentHandler {
	snapshots.RegisterAdapter("tms-bulletins", func(_ context.Context, _ staticcontent.Request) ([]byte, string, int, error) {
		body, err := fetchTMSBulletins()
		return body, fiber.MIMEApplicationJSONCharsetUTF8, fiber.StatusOK, err
	})
	return OfficialContentHandler{Snapshots: snapshots}
}

func officialHTTPClient(hosts []string, timeout time.Duration) *http.Client {
	if os.Getenv("HTTPS_PROXY") == "" && os.Getenv("https_proxy") == "" {
		return netsecurity.NewSafeHTTPClient(hosts, timeout)
	}
	allowed := make(map[string]struct{}, len(hosts))
	for _, host := range hosts {
		allowed[strings.ToLower(host)] = struct{}{}
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = http.ProxyFromEnvironment
	transport.TLSClientConfig = &tls.Config{MinVersion: tls.VersionTLS12}
	return &http.Client{
		Timeout:   timeout,
		Transport: transport,
		CheckRedirect: func(request *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			return netsecurity.ValidateHTTPSURL(request.URL.String(), allowed)
		},
	}
}

func readOfficialResponse(response *http.Response) ([]byte, error) {
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("official source returned status %d", response.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, officialContentLimit+1))
	if err != nil {
		return nil, err
	}
	if len(body) > officialContentLimit {
		return nil, errors.New("official source response exceeded size limit")
	}
	return body, nil
}

func performOfficialRequest(client *http.Client, method, rawURL string, payload []byte, headers http.Header, attempts int) ([]byte, error) {
	var lastErr error
	for attempt := 0; attempt < attempts; attempt++ {
		var requestBody io.Reader
		if payload != nil {
			requestBody = bytes.NewReader(payload)
		}
		request, err := http.NewRequest(method, rawURL, requestBody)
		if err != nil {
			return nil, err
		}
		request.Header = headers.Clone()
		response, err := client.Do(request)
		if err == nil {
			body, responseErr := readOfficialResponse(response)
			if responseErr == nil {
				return body, nil
			}
			err = responseErr
		}
		lastErr = err
		if attempt+1 < attempts {
			time.Sleep(150 * time.Millisecond)
		}
	}
	return nil, lastErr
}

func officialGET(ctx context.Context, snapshots *staticcontent.Service, rawURL, _ string, referer string) ([]byte, error) {
	headers := map[string]string{"Accept": "text/html,application/xhtml+xml"}
	if referer != "" {
		headers["Referer"] = referer
	}
	snapshot, err := snapshots.Get(ctx, staticcontent.Request{
		URL: rawURL, Method: http.MethodGet, Headers: headers,
	})
	if err != nil {
		return nil, err
	}
	return snapshot.ResponseBody, nil
}

func officialPOSTJSON(ctx context.Context, snapshots *staticcontent.Service, rawURL, _ string, referer string, payload any) ([]byte, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	headers := map[string]string{
		"Accept": "application/json, text/plain, */*", "Content-Type": "application/json",
		"X-Requested-With": "XMLHttpRequest",
	}
	if referer != "" {
		headers["Referer"] = referer
	}
	snapshot, err := snapshots.Get(ctx, staticcontent.Request{
		URL: rawURL, Method: http.MethodPost, Headers: headers, Body: body,
	})
	if err != nil {
		return nil, err
	}
	return snapshot.ResponseBody, nil
}

func boundedPositiveQuery(c *fiber.Ctx, key string, fallback, maximum int) int {
	value, err := strconv.Atoi(c.Query(key))
	if err != nil || value < 1 {
		return fallback
	}
	if value > maximum {
		return maximum
	}
	return value
}

func fetchTMSBulletins() ([]byte, error) {
	const host = "maplestory.beanfun.com"
	const mainURL = "https://maplestory.beanfun.com/main"
	client := officialHTTPClient([]string{host}, 30*time.Second)
	jar, err := cookiejar.New(nil)
	if err != nil {
		return nil, err
	}
	client.Jar = jar

	request, err := http.NewRequest(http.MethodGet, mainURL, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("User-Agent", "Mozilla/5.0 MapleHubContentMirror/1.0")
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	page, err := readOfficialResponse(response)
	if err != nil {
		return nil, err
	}
	match := antiforgeryTokenPattern.FindSubmatch(page)
	if len(match) != 2 {
		return nil, errors.New("TMS anti-forgery token was not found")
	}

	form := url.Values{
		"Kind":     {"0"},
		"Page":     {"1"},
		"method":   {"0"},
		"PageSize": {"30"},
	}
	request, err = http.NewRequest(http.MethodPost, mainURL+"?handler=BulletinProxy", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")
	request.Header.Set("X-CSRF-TOKEN", string(match[1]))
	request.Header.Set("X-Requested-With", "XMLHttpRequest")
	request.Header.Set("Referer", mainURL)
	request.Header.Set("User-Agent", "Mozilla/5.0 MapleHubContentMirror/1.0")
	response, err = client.Do(request)
	if err != nil {
		return nil, err
	}
	return readOfficialResponse(response)
}

func (h OfficialContentHandler) Get(c *fiber.Ctx) error {
	server := strings.ToLower(c.Params("server"))
	kind := strings.ToLower(c.Params("kind"))
	var (
		body        []byte
		contentType = fiber.MIMETextHTMLCharsetUTF8
		err         error
	)

	switch server {
	case "gms":
		if kind != "news" {
			return fiber.NewError(fiber.StatusBadRequest, "unsupported GMS content kind")
		}
		body, err = officialGET(c.UserContext(), h.Snapshots, "https://g.nexonstatic.com/maplestory/cms/v1/news", "g.nexonstatic.com", "https://www.nexon.com/maplestory/")
		contentType = fiber.MIMEApplicationJSONCharsetUTF8
	case "kms":
		if kind != "news" && kind != "events" && kind != "rankings" {
			return fiber.NewError(fiber.StatusBadRequest, "unsupported KMS content kind")
		}
		if kind == "rankings" {
			page := boundedPositiveQuery(c, "page", 1, 1000000)
			body, err = officialGET(c.UserContext(), h.Snapshots, fmt.Sprintf("https://maplestory.nexon.com/N23Ranking/World/Total?page=%d", page), "maplestory.nexon.com", "https://maplestory.nexon.com/N23Ranking/World/Total")
			if err != nil {
				body, err = officialGET(c.UserContext(), h.Snapshots, fmt.Sprintf("https://r.jina.ai/http://maplestory.nexon.com/N23Ranking/World/Total?page=%d", page), "r.jina.ai", "")
				contentType = fiber.MIMETextPlainCharsetUTF8
			}
			break
		}
		path := "Notice"
		if kind == "events" {
			path = "Event"
		}
		body, err = officialGET(c.UserContext(), h.Snapshots, "https://maplestory.nexon.com/News/"+path, "maplestory.nexon.com", "https://maplestory.nexon.com/")
	case "msea":
		if kind != "news" && kind != "events" {
			return fiber.NewError(fiber.StatusBadRequest, "unsupported MapleStorySEA content kind")
		}
		body, err = officialGET(c.UserContext(), h.Snapshots, "https://www.maplesea.com/"+kind+"/", "www.maplesea.com", "https://www.maplesea.com/")
	case "jms":
		if kind != "news" && kind != "rankings" {
			return fiber.NewError(fiber.StatusBadRequest, "unsupported JMS content kind")
		}
		if kind == "rankings" {
			page := boundedPositiveQuery(c, "page", 1, 1000000)
			query := url.Values{
				"p":         {strconv.Itoa(page)},
				"worldname": {"9999"},
				"jobname":   {"男女＋職業全体"},
			}
			body, err = officialGET(c.UserContext(), h.Snapshots, "https://maplestory.nexon.co.jp/community/exp/_ranklist/?"+query.Encode(), "maplestory.nexon.co.jp", "https://maplestory.nexon.co.jp/community/exp/ranking/")
			break
		}
		body, err = officialGET(c.UserContext(), h.Snapshots, "https://maplestory.nexon.co.jp/notice/_noticelist/?id=all&p=1", "maplestory.nexon.co.jp", "https://maplestory.nexon.co.jp/notice/all/")
		if err != nil {
			body, err = officialGET(c.UserContext(), h.Snapshots, "https://r.jina.ai/http://maplestory.nexon.co.jp/notice/_noticelist/?id=all&p=1", "r.jina.ai", "")
		}
	case "cms":
		if kind != "rankings" {
			return fiber.NewError(fiber.StatusBadRequest, "unsupported CMS content kind")
		}
		page := boundedPositiveQuery(c, "page", 1, 1000000)
		rankType := boundedPositiveQuery(c, "rankType", 1, 3)
		body, err = officialPOSTJSON(c.UserContext(), h.Snapshots,
			"https://maplestory-event.beanfun.com/api/UnionWebRank/FindRank",
			"maplestory-event.beanfun.com",
			"https://maplestory-event.beanfun.com/UnionWebRank/Index",
			map[string]int{"rankType": rankType, "gameWorldId": -1, "page": page},
		)
		contentType = fiber.MIMEApplicationJSONCharsetUTF8
	case "tms":
		if kind != "news" && kind != "rankings" {
			return fiber.NewError(fiber.StatusBadRequest, "unsupported TMS content kind")
		}
		if kind == "rankings" {
			page := boundedPositiveQuery(c, "page", 1, 1000000)
			rankType := boundedPositiveQuery(c, "rankType", 1, 3)
			body, err = officialPOSTJSON(c.UserContext(), h.Snapshots,
				"https://maplestory-event.beanfun.com/api/UnionWebRank/FindRank",
				"maplestory-event.beanfun.com",
				"https://maplestory-event.beanfun.com/UnionWebRank/Index",
				map[string]int{"rankType": rankType, "gameWorldId": -1, "page": page},
			)
			contentType = fiber.MIMEApplicationJSONCharsetUTF8
			break
		}
		snapshot, snapshotErr := h.Snapshots.GetAdapter(c.UserContext(), "tms-bulletins", "https://maplestory.beanfun.com/main")
		if snapshotErr == nil {
			body = snapshot.ResponseBody
		} else {
			err = snapshotErr
		}
		contentType = fiber.MIMEApplicationJSONCharsetUTF8
	default:
		return fiber.NewError(fiber.StatusBadRequest, "unsupported MapleStory server")
	}

	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, "official source unavailable: "+err.Error())
	}
	c.Set(fiber.HeaderCacheControl, "public, max-age=43200, stale-if-error=604800")
	c.Set(fiber.HeaderContentType, contentType)
	return c.Send(body)
}

func (h OfficialContentHandler) Article(c *fiber.Ctx) error {
	rawURL := c.Query("url")
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme != "https" {
		return fiber.NewError(fiber.StatusBadRequest, "invalid official article URL")
	}

	host := strings.ToLower(parsed.Hostname())
	allowed := map[string]struct{}{
		"maplestory.nexon.com":   {},
		"www.maplesea.com":       {},
		"maplestory.nexon.co.jp": {},
		"maplestory.beanfun.com": {},
		"www.nexon.com":          {},
		"g.nexonstatic.com":      {},
	}
	if err := netsecurity.ValidateHTTPSURL(rawURL, allowed); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "official article host is not allowed")
	}

	body, fetchErr := officialGET(c.UserContext(), h.Snapshots, rawURL, host, "")
	contentType := fiber.MIMETextHTMLCharsetUTF8
	if host == "g.nexonstatic.com" {
		contentType = fiber.MIMEApplicationJSONCharsetUTF8
	}
	if fetchErr != nil && host == "maplestory.nexon.co.jp" {
		mirrorURL := "https://r.jina.ai/http://" + parsed.Host + parsed.RequestURI()
		body, fetchErr = officialGET(c.UserContext(), h.Snapshots, mirrorURL, "r.jina.ai", "")
		contentType = fiber.MIMETextPlainCharsetUTF8
	}
	if fetchErr != nil {
		return fiber.NewError(fiber.StatusBadGateway, "official article unavailable: "+fetchErr.Error())
	}

	c.Set(fiber.HeaderCacheControl, "public, max-age=43200, stale-if-error=604800")
	c.Set(fiber.HeaderContentType, contentType)
	return c.Send(body)
}
