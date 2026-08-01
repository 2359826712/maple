package translation

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
)

var libreTranslateLanguageCodes = map[string]string{
	"en": "en", "zh": "zh", "zh-Hant": "zh", "ja": "ja", "ko": "ko",
}

var languageNames = map[string]string{
	"en": "English", "zh": "Simplified Chinese", "zh-Hant": "Traditional Chinese", "ja": "Japanese", "ko": "Korean",
}

var translatedMapleStoryPattern = regexp.MustCompile(`[枫楓][\p{Han}]?`)

type libreTranslateRequest struct {
	Q      string `json:"q"`
	Source string `json:"source"`
	Target string `json:"target"`
	Format string `json:"format,omitempty"`
	APIKey string `json:"api_key,omitempty"`
}

type libreTranslateResponse struct {
	TranslatedText string `json:"translatedText"`
}

type ollamaGenerateRequest struct {
	Model   string         `json:"model"`
	Prompt  string         `json:"prompt"`
	Stream  bool           `json:"stream"`
	Format  string         `json:"format"`
	Options map[string]any `json:"options,omitempty"`
	Think   *bool          `json:"think,omitempty"`
}

type ollamaGenerateResponse struct {
	Response string `json:"response"`
	Thinking string `json:"thinking"`
}

type ollamaTranslationResponse struct {
	Translations []string `json:"translations"`
}

func providerEndpoint(rawURL, defaultURL, expectedPath string) (*url.URL, error) {
	value := strings.TrimSpace(rawURL)
	if value == "" {
		value = defaultURL
	}
	endpoint, err := url.Parse(value)
	if err != nil || endpoint.Scheme == "" || endpoint.Host == "" {
		return nil, errors.New("translation provider URL is invalid")
	}
	if endpoint.Scheme != "http" && endpoint.Scheme != "https" {
		return nil, errors.New("translation provider URL must use http or https")
	}
	if expectedPath != "" && !strings.HasSuffix(strings.TrimRight(endpoint.Path, "/"), strings.TrimRight(expectedPath, "/")) {
		endpoint.Path = strings.TrimRight(endpoint.Path, "/") + expectedPath
	}
	return endpoint, nil
}

func readProviderResponse(response *http.Response, providerName string) ([]byte, error) {
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, maxResponseSize+1))
	if err != nil {
		return nil, err
	}
	if len(body) > maxResponseSize {
		return nil, fmt.Errorf("%s response exceeds 2 MB", providerName)
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("%s returned status %d", providerName, response.StatusCode)
	}
	return body, nil
}

func (s *Service) fetchLibreTranslate(ctx context.Context, request Request, texts []string) ([]string, []string, error) {
	endpoint, err := providerEndpoint(s.LibreTranslateAPIURL, "http://127.0.0.1:5000/translate", "/translate")
	if err != nil {
		return nil, nil, err
	}
	sourceLanguage := "auto"
	if request.SourceLanguage != "" {
		sourceLanguage = libreTranslateLanguageCodes[request.SourceLanguage]
	}
	targetLanguage := libreTranslateLanguageCodes[request.TargetLanguage]
	if targetLanguage == "" {
		return nil, nil, errors.New("unsupported LibreTranslate target language")
	}

	translated := make([]string, len(texts))
	detected := make([]string, len(texts))
	for index, text := range texts {
		payload := libreTranslateRequest{
			Q: text, Source: sourceLanguage, Target: targetLanguage, APIKey: s.LibreTranslateAPIKey,
		}
		if request.Format == "html" {
			payload.Format = "html"
		}
		body, err := json.Marshal(payload)
		if err != nil {
			return nil, nil, err
		}
		httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint.String(), bytes.NewReader(body))
		if err != nil {
			return nil, nil, err
		}
		httpRequest.Header.Set("Content-Type", "application/json")
		httpRequest.Header.Set("User-Agent", "MapleHubTranslation/1.0")
		response, err := s.Client.Do(httpRequest)
		if err != nil {
			return nil, nil, err
		}
		responseBody, err := readProviderResponse(response, "LibreTranslate")
		if err != nil {
			return nil, nil, err
		}
		var parsed libreTranslateResponse
		if err := json.Unmarshal(responseBody, &parsed); err != nil {
			return nil, nil, err
		}
		translated[index] = parsed.TranslatedText
		if request.SourceLanguage != "" {
			detected[index] = request.SourceLanguage
		}
	}
	return translated, detected, nil
}

func (s *Service) fetchOllama(ctx context.Context, request Request, texts []string) ([]string, []string, error) {
	endpoint, err := providerEndpoint(s.OllamaAPIURL, "http://127.0.0.1:11434", "/api/generate")
	if err != nil {
		return nil, nil, err
	}
	input, err := json.Marshal(texts)
	if err != nil {
		return nil, nil, err
	}
	sourceLanguageName := "Auto-detected"
	if request.SourceLanguage != "" {
		sourceLanguageName = languageNames[request.SourceLanguage]
	}
	noThink := false
	prompt := ollamaPrompt(request, sourceLanguageName, string(input))
	payload := ollamaGenerateRequest{
		Model:  s.OllamaModel,
		Prompt: prompt,
		Stream: false,
		Format: "json",
		Think:  &noThink,
		Options: map[string]any{
			"temperature": 0,
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, nil, err
	}
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint.String(), bytes.NewReader(body))
	if err != nil {
		return nil, nil, err
	}
	httpRequest.Header.Set("Content-Type", "application/json")
	httpRequest.Header.Set("User-Agent", "MapleHubTranslation/1.0")
	response, err := s.Client.Do(httpRequest)
	if err != nil {
		return nil, nil, err
	}
	responseBody, err := readProviderResponse(response, "Ollama")
	if err != nil {
		return nil, nil, err
	}
	var parsed ollamaGenerateResponse
	if err := json.Unmarshal(responseBody, &parsed); err != nil {
		return nil, nil, err
	}
	content := parsed.Response
	if strings.TrimSpace(content) == "" {
		content = parsed.Thinking
	}
	translated, err := parseOllamaTranslations(content, len(texts))
	if err != nil {
		return nil, nil, err
	}
	for index, source := range texts {
		translated[index] = preserveSourceTerms(source, translated[index])
	}
	detected := make([]string, len(translated))
	for index := range detected {
		detected[index] = request.SourceLanguage
	}
	return translated, detected, nil
}

func ollamaPrompt(request Request, sourceLanguageName string, input string) string {
	targetLanguageName := languageNames[request.TargetLanguage]
	common := map[string]string{
		"source": sourceLanguageName + " (" + request.SourceLanguage + ")",
		"target": targetLanguageName + " (" + request.TargetLanguage + ")",
		"format": request.Format,
		"input":  input,
	}
	switch request.TargetLanguage {
	case "zh":
		return fmt.Sprintf("请把下面 JSON 数组中的每个字符串翻译成简体中文。MapleStory 这个词必须原样保留，不要翻译成中文游戏名。NPC名、装备名、技能名、数字、URL、占位符和代码也必须原样保留。格式是 %s；如果是 html，只翻译文本并保留标签。只输出 JSON，格式为 {\"translations\":[\"...\"]}。输入：%s", common["format"], common["input"])
	case "zh-Hant":
		return fmt.Sprintf("請把下面 JSON 陣列中的每個字串翻譯成繁體中文。MapleStory 這個詞必須原樣保留，不要翻譯成中文遊戲名。NPC名、裝備名、技能名、數字、URL、佔位符和程式碼也必須原樣保留。格式是 %s；如果是 html，只翻譯文字並保留標籤。只輸出 JSON，格式為 {\"translations\":[\"...\"]}。輸入：%s", common["format"], common["input"])
	case "ja":
		return fmt.Sprintf("次の JSON 配列の各文字列を日本語に翻訳してください。MapleStory、NPC名、装備名、スキル名、数字、URL、プレースホルダー、コードはそのまま保持してください。形式は %s です。html の場合はタグを保持し、テキストだけを翻訳してください。出力は {\"translations\":[\"...\"]} 形式の JSON のみにしてください。入力: %s", common["format"], common["input"])
	case "ko":
		return fmt.Sprintf("다음 JSON 배열의 각 문자열을 한국어로 번역하세요. MapleStory, NPC 이름, 장비 이름, 스킬 이름, 숫자, URL, 자리표시자, 코드는 그대로 보존하세요. 형식은 %s입니다. html이면 태그를 보존하고 텍스트만 번역하세요. 출력은 {\"translations\":[\"...\"]} 형태의 JSON만 허용됩니다. 입력: %s", common["format"], common["input"])
	default:
		return fmt.Sprintf("Translate each string in this JSON array to %s. Translate only natural language; preserve MapleStory, NPC names, equipment names, skill names, numbers, URLs, placeholders, and code exactly. If the format is html, preserve every tag, attribute, and data-* marker while translating only human-readable text. Source language: %s. Format: %s. Return only JSON shaped exactly as {\"translations\":[\"...\"]}. Input: %s", common["target"], common["source"], common["format"], common["input"])
	}
}

func parseOllamaTranslations(content string, expectedCount int) ([]string, error) {
	cleaned := strings.TrimSpace(content)
	if strings.HasPrefix(cleaned, "```") {
		cleaned = strings.TrimPrefix(cleaned, "```json")
		cleaned = strings.TrimPrefix(cleaned, "```")
		cleaned = strings.TrimSuffix(cleaned, "```")
		cleaned = strings.TrimSpace(cleaned)
	}
	if thinkEnd := strings.LastIndex(cleaned, "</think>"); thinkEnd >= 0 {
		cleaned = strings.TrimSpace(cleaned[thinkEnd+len("</think>"):])
	}
	if !strings.HasPrefix(cleaned, "{") {
		start := strings.Index(cleaned, "{")
		end := strings.LastIndex(cleaned, "}")
		if start >= 0 && end > start {
			cleaned = cleaned[start : end+1]
		}
	}
	var parsed ollamaTranslationResponse
	if err := json.Unmarshal([]byte(cleaned), &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Translations) != expectedCount {
		return nil, fmt.Errorf("Ollama returned %d translations for %d inputs", len(parsed.Translations), expectedCount)
	}
	for index, translated := range parsed.Translations {
		parsed.Translations[index] = cleanOllamaTranslation(translated)
	}
	return parsed.Translations, nil
}

func cleanOllamaTranslation(value string) string {
	cleaned := strings.TrimSpace(value)
	if strings.HasPrefix(cleaned, "[") && strings.HasSuffix(cleaned, "]") && !strings.Contains(cleaned, "\",\"") {
		cleaned = strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(cleaned, "["), "]"))
	}
	return strings.Trim(cleaned, "\"")
}

func preserveSourceTerms(source string, translated string) string {
	if strings.Contains(source, "MapleStory") {
		translated = strings.NewReplacer(
			"冒险岛", "MapleStory",
			"冒險島", "MapleStory",
			"楓之谷", "MapleStory",
			"枫之谷", "MapleStory",
			"枫谷游戏", "MapleStory",
			"楓谷遊戲", "MapleStory",
			"枫地图", "MapleStory",
			"枫雪", "MapleStory",
			"メイプルストーリー", "MapleStory",
			"メープルストーリー", "MapleStory",
			"메이플스토리", "MapleStory",
		).Replace(translated)
		if !strings.Contains(translated, "MapleStory") {
			translated = translatedMapleStoryPattern.ReplaceAllString(translated, "MapleStory")
		}
	}
	return translated
}
