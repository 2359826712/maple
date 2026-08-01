package wikimirror

import (
	"strings"
	"testing"
)

func TestIsMapleStoryMNamuTitle(t *testing.T) {
	t.Parallel()
	valid := []string{
		"메이플스토리M",
		"메이플스토리M/직업",
		"메이플스토리M/장비_아이템",
		"빅토리아 아일랜드(메이플스토리M)",
		"Cygnus Knights (메이플스토리 M)",
	}
	for _, title := range valid {
		if !isMapleStoryMNamuTitle(title) {
			t.Errorf("expected %q to be recognized as a MapleStory M title", title)
		}
	}

	invalid := []string{
		"메이플스토리",
		"메이플스토리/직업",
		"메이플스토리M2",
		"MapleStory M",
	}
	for _, title := range invalid {
		if isMapleStoryMNamuTitle(title) {
			t.Errorf("did not expect %q to be recognized as a MapleStory M title", title)
		}
	}
}

func TestParseNamuPageSanitizesAndRewritesRelatedLinks(t *testing.T) {
	t.Parallel()
	padding := strings.Repeat("Complete MapleStory M class and progression reference content. ", 12)
	fixture := `<!doctype html><html><body><article>
		<header><h1>MapleStory M Classes</h1><time datetime="2026-07-16T10:30:00Z"></time></header>
		<main class="random-generated-class">
			<p>` + padding + `</p>
			<a href="/w/%EB%A9%94%EC%9D%B4%ED%94%8C%EC%8A%A4%ED%86%A0%EB%A6%ACM/%EC%A7%81%EC%97%85#s-1">Jobs</a>
			<a href="/w/%EB%A9%94%EC%9D%B4%ED%94%8C%EC%8A%A4%ED%86%A0%EB%A6%AC">Other wiki page</a>
			<img data-src="/images/class.png" alt="Class">
			<script>alert("unsafe")</script>
		</main>
	</article></body></html>`

	page, err := parseNamuPage(strings.NewReader(fixture), "https://en.namu.wiki/w/root", "메이플스토리M")
	if err != nil {
		t.Fatalf("parseNamuPage returned an error: %v", err)
	}
	if page.DisplayTitle != "MapleStory M Classes" {
		t.Fatalf("unexpected display title: %q", page.DisplayTitle)
	}
	if page.TouchedAt == nil {
		t.Fatal("expected the page modification timestamp to be retained")
	}
	if len(page.RelatedTitles) != 1 || page.RelatedTitles[0] != "메이플스토리M/직업" {
		t.Fatalf("unexpected related titles: %#v", page.RelatedTitles)
	}
	if !strings.Contains(page.ContentHTML, "/wiki/article/") ||
		!strings.Contains(page.ContentHTML, "series=maplestory-m") {
		t.Fatalf("expected a local article link, got: %s", page.ContentHTML)
	}
	if !strings.Contains(page.ContentHTML, `src="https://en.namu.wiki/images/class.png"`) {
		t.Fatalf("expected the lazy image source to be promoted and absolutized: %s", page.ContentHTML)
	}
	if strings.Contains(page.ContentHTML, "random-generated-class") ||
		strings.Contains(page.ContentHTML, "<script") ||
		strings.Contains(page.ContentHTML, "alert(") {
		t.Fatalf("unsafe or source-only markup remained: %s", page.ContentHTML)
	}
	if !strings.Contains(page.ContentHTML, "https://en.namu.wiki/w/") {
		t.Fatalf("expected unrelated NamuWiki links to remain canonical external links: %s", page.ContentHTML)
	}
	if len([]rune(page.ContentText)) < 100 {
		t.Fatalf("expected complete text content, got %d runes", len([]rune(page.ContentText)))
	}
}

func TestStableNamuPageID(t *testing.T) {
	t.Parallel()
	first := stableNamuPageID("maplestorym-namu", "메이플스토리M/직업")
	second := stableNamuPageID("maplestorym-namu", "메이플스토리M/직업")
	other := stableNamuPageID("maplestorym-namu", "메이플스토리M/스토리")
	if first <= 0 || first != second {
		t.Fatalf("expected a stable positive ID, got %d and %d", first, second)
	}
	if first == other {
		t.Fatalf("expected distinct titles to have distinct IDs, both were %d", first)
	}
}

func TestClassifyNamuPage(t *testing.T) {
	t.Parallel()
	tests := map[string]string{
		"메이플스토리M/직업":     "classes",
		"메이플스토리M/장비 아이템": "items",
		"메이플스토리M/스토리":    "quests",
		"메이플스토리M/공략과 팁":  "content",
	}
	for title, expected := range tests {
		if actual := classifyNamuPage(title, title, ""); actual != expected {
			t.Errorf("classifyNamuPage(%q) = %q; want %q", title, actual, expected)
		}
	}
}
