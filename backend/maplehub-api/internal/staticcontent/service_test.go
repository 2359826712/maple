package staticcontent

import "testing"

func TestNormalizeRequestAllowsOnlyStaticSourceAllowlist(t *testing.T) {
	request, err := normalizeRequest(Request{URL: "https://grandislibrary.com/content"})
	if err != nil {
		t.Fatal(err)
	}
	if request.Method != "GET" {
		t.Fatalf("unexpected method: %s", request.Method)
	}

	for _, rawURL := range []string{
		"http://grandislibrary.com/content",
		"https://127.0.0.1/content",
		"https://example.com/content",
	} {
		if _, err := normalizeRequest(Request{URL: rawURL}); err == nil {
			t.Fatalf("unsafe static source accepted: %s", rawURL)
		}
	}
}

func TestNormalizeRequestAllowsOfficialTMSRankingsSource(t *testing.T) {
	request, err := normalizeRequest(Request{
		URL:    "https://maplestory-event.beanfun.com/api/UnionWebRank/FindRank",
		Method: "POST",
		Body:   []byte(`{"rankType":1,"gameWorldId":-1,"page":1}`),
	})
	if err != nil {
		t.Fatal(err)
	}
	if request.Method != "POST" {
		t.Fatalf("unexpected method: %s", request.Method)
	}
}

func TestCacheKeyIncludesRequestBody(t *testing.T) {
	first, err := normalizeRequest(Request{
		URL:    "https://v66rewn65j.execute-api.us-west-2.amazonaws.com/prod/fetch-mongodb",
		Method: "POST", Body: []byte(`{"region":"grandis"}`),
	})
	if err != nil {
		t.Fatal(err)
	}
	second := first
	second.Body = []byte(`{"region":"maple_world"}`)
	if CacheKey(first) == CacheKey(second) {
		t.Fatal("distinct POST bodies produced the same cache key")
	}
}
