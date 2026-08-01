package translation

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNormalizeRequestSupportsSiteLocales(t *testing.T) {
	request, err := normalizeRequest(Request{
		Texts: []string{"Hello"}, TargetLanguage: "zh-TW", SourceLanguage: "en-US", Format: "html",
	})
	if err != nil {
		t.Fatal(err)
	}
	if request.TargetLanguage != "zh-Hant" || request.SourceLanguage != "en" {
		t.Fatalf("unexpected locales: %#v", request)
	}
}

func TestNormalizeRequestRejectsUnsupportedInput(t *testing.T) {
	for _, request := range []Request{
		{Texts: nil, TargetLanguage: "zh"},
		{Texts: []string{"Hello"}, TargetLanguage: "fr"},
		{Texts: []string{"Hello"}, TargetLanguage: "zh", Format: "markdown"},
	} {
		if _, err := normalizeRequest(request); err == nil {
			t.Fatalf("invalid request accepted: %#v", request)
		}
	}
}

func TestSourceHashIncludesDeclaredLanguage(t *testing.T) {
	if sourceHash("en", "Maple") == sourceHash("ko", "Maple") {
		t.Fatal("source language was not included in the translation cache key")
	}
}

func TestFetchLibreTranslateUsesLocalProvider(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var request libreTranslateRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatal(err)
		}
		if request.Source != "en" || request.Target != "ja" || request.Format != "html" {
			t.Fatalf("unexpected LibreTranslate request: %#v", request)
		}
		_ = json.NewEncoder(w).Encode(libreTranslateResponse{TranslatedText: "こんにちは"})
	}))
	defer server.Close()

	service := &Service{Client: server.Client(), LibreTranslateAPIURL: server.URL + "/translate"}
	translated, detected, err := service.fetchLibreTranslate(context.Background(), Request{
		Texts: []string{"Hello"}, TargetLanguage: "ja", SourceLanguage: "en", Format: "html",
	}, []string{"Hello"})
	if err != nil {
		t.Fatal(err)
	}
	if translated[0] != "こんにちは" || detected[0] != "en" {
		t.Fatalf("unexpected translation result: %#v %#v", translated, detected)
	}
}

func TestParseOllamaTranslationsExtractsJsonOnly(t *testing.T) {
	translated, err := parseOllamaTranslations("<think>skip</think>\n```json\n{\"translations\":[\"你好\",\"世界\"]}\n```", 2)
	if err != nil {
		t.Fatal(err)
	}
	if translated[0] != "你好" || translated[1] != "世界" {
		t.Fatalf("unexpected Ollama translations: %#v", translated)
	}
}

func TestPreserveSourceTermsKeepsMapleStoryLiteral(t *testing.T) {
	translated := preserveSourceTerms("Open the MapleStory reward shop.", "打开枫满奖励商店")
	if translated != "打开MapleStory奖励商店" {
		t.Fatalf("unexpected preserved translation: %q", translated)
	}
}
