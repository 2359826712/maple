package wikimirror

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"hash/fnv"
	"html"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"

	"maplehub/internal/contentsecurity"
	"maplehub/internal/netsecurity"
	"maplehub/internal/repo"

	htmlnode "golang.org/x/net/html"
)

type Syncer struct {
	Repo       repo.WikiMirrorRepo
	HTTPClient *http.Client
}

// FindSource returns the mediaWikiSource for the given key, or false if not found.
func FindSource(key string) (mediaWikiSource, bool) {
	for _, s := range sources {
		if s.Key == key {
			return s, true
		}
	}
	return mediaWikiSource{}, false
}

// FetchParsedPage is the exported wrapper for fetchParsedPage, used by the reparse handler.
func (s Syncer) FetchParsedPage(ctx context.Context, source mediaWikiSource, title string) (ParsedWikiPage, error) {
	return s.fetchParsedPage(ctx, source, title)
}

type SyncOptions struct {
	SourceKey string
	MaxPages  int
}

type mediaWikiSource struct {
	Key         string
	Name        string
	APIURL      string
	PageURLBase string
	Kind        string
	SeedTitle   string
}

var sources = []mediaWikiSource{
	{Key: "mswiki", Name: "MapleStory Wiki", APIURL: "https://maplestorywiki.net/api.php", PageURLBase: "https://maplestorywiki.net/w/"},
	{Key: "fandom", Name: "MapleStory Fandom Wiki", APIURL: "https://maplestory.fandom.com/api.php", PageURLBase: "https://maplestory.fandom.com/wiki/"},
	{Key: "mapleclassic", Name: "MapleStory Classic Wiki", APIURL: "https://mapleclassic.wiki/api.php", PageURLBase: "https://mapleclassic.wiki/w/"},
	{Key: "maplestorym-fandom", Name: "MapleStory M Wiki", APIURL: "https://maplestorym-archive.fandom.com/api.php", PageURLBase: "https://maplestorym-archive.fandom.com/wiki/"},
	{
		Key:         "maplestorym-namu",
		Name:        "MapleStory M NamuWiki",
		APIURL:      "https://en.namu.wiki/w/%EB%A9%94%EC%9D%B4%ED%94%8C%EC%8A%A4%ED%86%A0%EB%A6%ACM",
		PageURLBase: "https://en.namu.wiki/w/",
		Kind:        "namu-html",
		SeedTitle:   "메이플스토리M",
	},
}

var allowedWikiHosts = map[string]struct{}{
	"maplestorywiki.net":             {},
	"maplestory.fandom.com":          {},
	"mapleclassic.wiki":              {},
	"maplestorym-archive.fandom.com": {},
	"en.namu.wiki":                   {},
}

type allPagesResponse struct {
	Continue struct {
		GAPContinue string `json:"gapcontinue"`
	} `json:"continue"`
	Query struct {
		Pages map[string]mwPage `json:"pages"`
	} `json:"query"`
}

type mwPage struct {
	PageID     int64        `json:"pageid"`
	NS         int          `json:"ns"`
	Title      string       `json:"title"`
	FullURL    string       `json:"fullurl"`
	Touched    string       `json:"touched"`
	Categories []mwTitle    `json:"categories"`
	Images     []mwTitle    `json:"images"`
	Templates  []mwTitle    `json:"templates"`
	Revisions  []mwRevision `json:"revisions"`
}

type mwTitle struct {
	Title string `json:"title"`
}

type mwRevision struct {
	Revid int64 `json:"revid"`
}

type parseResponse struct {
	Parse struct {
		Title  string `json:"title"`
		PageID int64  `json:"pageid"`
		Text   struct {
			HTML string `json:"*"`
		} `json:"text"`
		Categories []mwParseCategory `json:"categories"`
		Images     []string          `json:"images"`
		Templates  []mwParseTemplate `json:"templates"`
	} `json:"parse"`
}

type mwParseCategory struct {
	Title string `json:"*"`
}

type mwParseTemplate struct {
	Title string `json:"*"`
}

var (
	tagsPattern        = regexp.MustCompile(`(?is)<script[^>]*>.*?</script>|<style[^>]*>.*?</style>|<noscript[^>]*>.*?</noscript>|<iframe[^>]*>.*?</iframe>|<form[^>]*>.*?</form>`)
	elementPattern     = regexp.MustCompile(`(?is)<[^>]+>`)
	spacePattern       = regexp.MustCompile(`\s+`)
	imgSrcPattern      = regexp.MustCompile(`(?is)<img[^>]+src=["']([^"']+)["']`)
	editSectionPattern = regexp.MustCompile(`(?is)<span[^>]+class=["'][^"']*mw-editsection[^"']*["'][^>]*>.*?</span>`)
)

func (s Syncer) Sync(ctx context.Context, opts SyncOptions) error {
	namespaces := []int{0, 6, 10, 14}
	for _, source := range sources {
		if opts.SourceKey != "" && source.Key != opts.SourceKey {
			continue
		}
		if source.Kind == "namu-html" {
			if err := s.syncNamuSource(ctx, source, opts.MaxPages); err != nil {
				return err
			}
			continue
		}
		for _, namespace := range namespaces {
			if err := s.syncNamespace(ctx, source, namespace, opts.MaxPages); err != nil {
				return err
			}
		}
	}
	return nil
}

func (s Syncer) syncNamespace(ctx context.Context, source mediaWikiSource, namespace int, maxPages int) error {
	startedAt := time.Now()
	processed := 0
	continueToken := ""
	if err := s.Repo.SetSyncState(ctx, repo.WikiMirrorSyncState{
		SourceKey: source.Key,
		Namespace: namespace,
		Status:    "running",
		StartedAt: &startedAt,
	}); err != nil {
		return err
	}

	for {
		if maxPages > 0 && processed >= maxPages {
			break
		}

		limit := 50
		if maxPages > 0 && maxPages-processed < limit {
			limit = maxPages - processed
		}
		resp, err := s.fetchAllPages(ctx, source, namespace, continueToken, limit)
		if err != nil {
			_ = s.Repo.SetSyncState(ctx, repo.WikiMirrorSyncState{
				SourceKey: source.Key, Namespace: namespace, ContinueToken: continueToken,
				Status: "failed", Message: err.Error(), ProcessedPages: processed, StartedAt: &startedAt,
			})
			return err
		}

		pages := make([]mwPage, 0, len(resp.Query.Pages))
		for _, page := range resp.Query.Pages {
			if page.PageID > 0 && page.Title != "" {
				pages = append(pages, page)
			}
		}
		sort.Slice(pages, func(i, j int) bool { return pages[i].Title < pages[j].Title })

		for _, page := range pages {
			if err := ctx.Err(); err != nil {
				return err
			}
			if maxPages > 0 && processed >= maxPages {
				break
			}
			parsed, err := s.fetchParsedPage(ctx, source, page.Title)
			if err != nil {
				parsed = ParsedWikiPage{Text: "", HTML: ""}
			}
			input := pageInputFromMediaWiki(source, page, parsed)
			if _, err := s.Repo.UpsertPage(ctx, input); err != nil {
				return err
			}
			if namespace == 10 {
				if err := s.Repo.UpsertTemplate(ctx, repo.WikiMirrorTemplateInput{
					SourceKey: source.Key, SourcePageID: page.PageID, Title: page.Title,
					ContentText: parsed.Text, ContentHTML: parsed.HTML,
				}); err != nil {
					return err
				}
			}
			processed++
			if processed%25 == 0 {
				_ = s.Repo.SetSyncState(ctx, repo.WikiMirrorSyncState{
					SourceKey: source.Key, Namespace: namespace, ContinueToken: continueToken,
					Status: "running", Message: "syncing", ProcessedPages: processed, StartedAt: &startedAt,
				})
			}
			time.Sleep(100 * time.Millisecond)
		}

		continueToken = resp.Continue.GAPContinue
		if continueToken == "" || len(pages) == 0 {
			break
		}
	}

	finishedAt := time.Now()
	if err := s.Repo.SetSyncState(ctx, repo.WikiMirrorSyncState{
		SourceKey: source.Key, Namespace: namespace, ContinueToken: continueToken,
		Status: "complete", Message: "sync complete", ProcessedPages: processed, StartedAt: &startedAt, FinishedAt: &finishedAt,
	}); err != nil {
		return err
	}
	return nil
}

type namuMirrorPage struct {
	Title         string
	DisplayTitle  string
	SourceURL     string
	ContentText   string
	ContentHTML   string
	RelatedTitles []string
	TouchedAt     *time.Time
}

func (s Syncer) syncNamuSource(ctx context.Context, source mediaWikiSource, maxPages int) error {
	const namespace = 0
	const defaultPageLimit = 1000

	startedAt := time.Now()
	processed := 0
	pageLimit := maxPages
	if pageLimit <= 0 {
		pageLimit = defaultPageLimit
	}
	if err := s.Repo.SetSyncState(ctx, repo.WikiMirrorSyncState{
		SourceKey: source.Key,
		Namespace: namespace,
		Status:    "running",
		Message:   "discovering MapleStory M NamuWiki pages",
		StartedAt: &startedAt,
	}); err != nil {
		return err
	}

	queue := []string{source.SeedTitle}
	queued := map[string]struct{}{normalizeNamuTitle(source.SeedTitle): {}}
	seen := make(map[string]struct{})

	fail := func(err error) error {
		_ = s.Repo.SetSyncState(ctx, repo.WikiMirrorSyncState{
			SourceKey: source.Key, Namespace: namespace, Status: "failed",
			Message: err.Error(), ProcessedPages: processed, StartedAt: &startedAt,
		})
		return err
	}

	for len(queue) > 0 && processed < pageLimit {
		if err := ctx.Err(); err != nil {
			return fail(err)
		}

		title := queue[0]
		queue = queue[1:]
		normalizedTitle := normalizeNamuTitle(title)
		if _, ok := seen[normalizedTitle]; ok {
			continue
		}
		seen[normalizedTitle] = struct{}{}

		page, err := s.fetchNamuPage(ctx, source, title)
		if err != nil {
			return fail(fmt.Errorf("fetch NamuWiki page %q: %w", title, err))
		}
		tags := []string{
			source.Name,
			"MapleStory M",
			"NamuWiki",
			"CC BY-NC-SA 2.0 KR",
			"non-commercial mirror",
			"namu-display-title:" + page.DisplayTitle,
		}
		category := classifyNamuPage(page.Title, page.DisplayTitle, page.ContentText)
		if _, err := s.Repo.UpsertPage(ctx, repo.WikiMirrorPageInput{
			SourceKey:    source.Key,
			SourcePageID: stableNamuPageID(source.Key, page.Title),
			Namespace:    namespace,
			Title:        page.Title,
			Slug:         slugify(page.Title),
			Category:     category,
			SourceURL:    page.SourceURL,
			Extract:      firstText(page.ContentText, 220),
			ContentText:  page.ContentText,
			ContentHTML:  page.ContentHTML,
			WordCount:    len(strings.Fields(page.ContentText)),
			TouchedAt:    page.TouchedAt,
			Tags:         uniqueStrings(tags),
			AssetURLs:    extractImageURLs(page.ContentHTML, source),
		}); err != nil {
			return fail(err)
		}
		processed++

		sort.Strings(page.RelatedTitles)
		for _, relatedTitle := range page.RelatedTitles {
			key := normalizeNamuTitle(relatedTitle)
			if _, alreadySeen := seen[key]; alreadySeen {
				continue
			}
			if _, alreadyQueued := queued[key]; alreadyQueued {
				continue
			}
			queued[key] = struct{}{}
			queue = append(queue, relatedTitle)
		}

		if processed%10 == 0 {
			_ = s.Repo.SetSyncState(ctx, repo.WikiMirrorSyncState{
				SourceKey: source.Key, Namespace: namespace,
				ContinueToken: strings.Join(queue, "\n"),
				Status:        "running", Message: fmt.Sprintf("discovered %d pages; %d queued", processed, len(queue)),
				ProcessedPages: processed, StartedAt: &startedAt,
			})
		}

		if len(queue) > 0 && processed < pageLimit {
			timer := time.NewTimer(time.Second)
			select {
			case <-ctx.Done():
				timer.Stop()
				return fail(ctx.Err())
			case <-timer.C:
			}
		}
	}

	finishedAt := time.Now()
	message := "sync complete; related-page queue exhausted"
	continueToken := ""
	if len(queue) > 0 {
		message = fmt.Sprintf("sync stopped at safety limit %d with %d pages queued", pageLimit, len(queue))
		continueToken = strings.Join(queue, "\n")
	}
	if err := s.Repo.SetSyncState(ctx, repo.WikiMirrorSyncState{
		SourceKey: source.Key, Namespace: namespace, ContinueToken: continueToken,
		Status: "complete", Message: message, ProcessedPages: processed,
		StartedAt: &startedAt, FinishedAt: &finishedAt,
	}); err != nil {
		return err
	}
	return nil
}

func (s Syncer) fetchNamuPage(ctx context.Context, source mediaWikiSource, title string) (namuMirrorPage, error) {
	requestURL := namuPageURL(source, title)
	if err := netsecurity.ValidateHTTPSURL(requestURL, allowedWikiHosts); err != nil {
		return namuMirrorPage{}, err
	}
	client := s.HTTPClient
	if client == nil {
		client = netsecurity.NewSafeHTTPClient([]string{"en.namu.wiki"}, 45*time.Second)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return namuMirrorPage{}, err
	}
	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	req.Header.Set("Accept-Language", "en,ko;q=0.8")
	req.Header.Set("User-Agent", "MPStorysNonCommercialMirror/1.0 (+https://mpstorys.com)")
	resp, err := client.Do(req)
	if err != nil {
		return namuMirrorPage{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return namuMirrorPage{}, fmt.Errorf("NamuWiki request failed %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	return parseNamuPage(io.LimitReader(resp.Body, 12<<20), requestURL, title)
}

func parseNamuPage(reader io.Reader, sourceURL, sourceTitle string) (namuMirrorPage, error) {
	document, err := htmlnode.Parse(reader)
	if err != nil {
		return namuMirrorPage{}, err
	}
	article := findElement(document, "article")
	if article == nil {
		return namuMirrorPage{}, errors.New("NamuWiki response does not contain an article")
	}

	displayTitle := strings.TrimSpace(nodeText(findElement(article, "h1")))
	if displayTitle == "" {
		displayTitle = sourceTitle
	}
	var touchedAt *time.Time
	if timeNode := findElement(article, "time"); timeNode != nil {
		if value := nodeAttribute(timeNode, "datetime"); value != "" {
			if parsed, err := time.Parse(time.RFC3339, value); err == nil {
				touchedAt = &parsed
			}
		}
	}

	contentRoot := dominantNamuContent(article)
	related := make([]string, 0)
	prepareNamuContent(contentRoot, sourceURL, &related)

	var rendered bytes.Buffer
	if err := htmlnode.Render(&rendered, contentRoot); err != nil {
		return namuMirrorPage{}, err
	}
	cleanHTML := contentsecurity.SanitizeHTML(rendered.String())
	contentText := htmlToText(cleanHTML)
	if len([]rune(contentText)) < 100 {
		return namuMirrorPage{}, errors.New("NamuWiki article content is unexpectedly short")
	}
	return namuMirrorPage{
		Title:         normalizeNamuTitle(sourceTitle),
		DisplayTitle:  displayTitle,
		SourceURL:     sourceURL,
		ContentText:   contentText,
		ContentHTML:   cleanHTML,
		RelatedTitles: uniqueStrings(related),
		TouchedAt:     touchedAt,
	}, nil
}

func dominantNamuContent(article *htmlnode.Node) *htmlnode.Node {
	current := article
	for depth := 0; depth < 3; depth++ {
		total := nodeTextLength(current)
		var largest *htmlnode.Node
		largestLength := 0
		for child := current.FirstChild; child != nil; child = child.NextSibling {
			if child.Type != htmlnode.ElementNode {
				continue
			}
			switch child.Data {
			case "article", "main", "section", "div":
			default:
				continue
			}
			length := nodeTextLength(child)
			if length > largestLength {
				largest = child
				largestLength = length
			}
		}
		if largest == nil || largestLength < 500 || total == 0 || largestLength*100 < total*85 {
			break
		}
		current = largest
	}
	return current
}

func prepareNamuContent(node *htmlnode.Node, sourceURL string, related *[]string) {
	if node == nil {
		return
	}
	if node.Type == htmlnode.ElementNode {
		removeNodeAttribute(node, "class")
		removeNodeAttribute(node, "style")
		removeNodeAttribute(node, "srcset")

		if node.Data == "img" {
			src := nodeAttribute(node, "src")
			if src == "" {
				src = nodeAttribute(node, "data-src")
			}
			if src == "" {
				src = nodeAttribute(node, "data-original")
			}
			if absolute := absoluteNamuURL(sourceURL, src); absolute != "" {
				setNodeAttribute(node, "src", absolute)
			}
			removeNodeAttribute(node, "data-src")
			removeNodeAttribute(node, "data-original")
			setNodeAttributeIfMissing(node, "loading", "lazy")
		}

		if node.Data == "a" {
			href := nodeAttribute(node, "href")
			if title, fragment, ok := namuTitleFromHref(sourceURL, href); ok {
				if isMapleStoryMNamuTitle(title) {
					*related = append(*related, title)
					localHref := "/wiki/article/" + url.PathEscape(title) + "?series=maplestory-m"
					if fragment != "" {
						localHref += "#" + url.PathEscape(fragment)
					}
					setNodeAttribute(node, "href", localHref)
				} else if absolute := absoluteNamuURL(sourceURL, href); absolute != "" {
					setNodeAttribute(node, "href", absolute)
				}
			} else if absolute := absoluteNamuURL(sourceURL, href); absolute != "" {
				setNodeAttribute(node, "href", absolute)
			}
		}
	}
	for child := node.FirstChild; child != nil; child = child.NextSibling {
		prepareNamuContent(child, sourceURL, related)
	}
}

func normalizeNamuTitle(title string) string {
	title = strings.TrimSpace(title)
	title = strings.ReplaceAll(title, "_", " ")
	if unescaped, err := url.PathUnescape(title); err == nil {
		title = unescaped
	}
	return strings.TrimSpace(title)
}

func isMapleStoryMNamuTitle(title string) bool {
	normalized := normalizeNamuTitle(title)
	compact := strings.ReplaceAll(normalized, " ", "")
	return compact == "메이플스토리M" ||
		strings.HasPrefix(compact, "메이플스토리M/") ||
		strings.Contains(compact, "(메이플스토리M)") ||
		strings.Contains(compact, "（메이플스토리M）")
}

func namuPageURL(source mediaWikiSource, title string) string {
	segments := strings.Split(normalizeNamuTitle(title), "/")
	for index, segment := range segments {
		segments[index] = url.PathEscape(segment)
	}
	return strings.TrimRight(source.PageURLBase, "/") + "/" + strings.Join(segments, "/")
}

func namuTitleFromHref(sourceURL, href string) (string, string, bool) {
	if strings.TrimSpace(href) == "" {
		return "", "", false
	}
	base, err := url.Parse(sourceURL)
	if err != nil {
		return "", "", false
	}
	target, err := base.Parse(href)
	if err != nil || !strings.EqualFold(target.Hostname(), "en.namu.wiki") || !strings.HasPrefix(target.EscapedPath(), "/w/") {
		return "", "", false
	}
	escapedTitle := strings.TrimPrefix(target.EscapedPath(), "/w/")
	title, err := url.PathUnescape(escapedTitle)
	if err != nil {
		return "", "", false
	}
	title = normalizeNamuTitle(title)
	if title == "" {
		return "", "", false
	}
	return title, target.Fragment, true
}

func absoluteNamuURL(sourceURL, value string) string {
	value = strings.TrimSpace(value)
	if value == "" || strings.HasPrefix(value, "data:") || strings.HasPrefix(value, "javascript:") {
		return ""
	}
	if strings.HasPrefix(value, "//") {
		return "https:" + value
	}
	base, err := url.Parse(sourceURL)
	if err != nil {
		return ""
	}
	target, err := base.Parse(value)
	if err != nil || target.Scheme != "https" {
		return ""
	}
	return target.String()
}

func stableNamuPageID(sourceKey, title string) int64 {
	hash := fnv.New64a()
	_, _ = hash.Write([]byte(sourceKey))
	_, _ = hash.Write([]byte{0})
	_, _ = hash.Write([]byte(normalizeNamuTitle(title)))
	value := int64(hash.Sum64() & 0x7fffffffffffffff)
	if value == 0 {
		return 1
	}
	return value
}

func classifyNamuPage(title, displayTitle, content string) string {
	compactTitle := strings.ReplaceAll(normalizeNamuTitle(title), " ", "")
	switch {
	case strings.HasPrefix(compactTitle, "메이플스토리M/직업"):
		return "classes"
	case strings.HasPrefix(compactTitle, "메이플스토리M/장비아이템"),
		strings.HasPrefix(compactTitle, "메이플스토리M/소비아이템"),
		strings.HasPrefix(compactTitle, "메이플스토리M/펫"):
		return "items"
	case strings.HasPrefix(compactTitle, "메이플스토리M/스토리"):
		return "quests"
	case strings.HasPrefix(compactTitle, "메이플스토리M/게임콘텐츠"),
		strings.HasPrefix(compactTitle, "메이플스토리M/공략과팁"),
		compactTitle == "메이플스토리M":
		return "content"
	}
	return ClassifyPage(displayTitle, nil, content, 0)
}

func findElement(node *htmlnode.Node, name string) *htmlnode.Node {
	if node == nil {
		return nil
	}
	if node.Type == htmlnode.ElementNode && strings.EqualFold(node.Data, name) {
		return node
	}
	for child := node.FirstChild; child != nil; child = child.NextSibling {
		if found := findElement(child, name); found != nil {
			return found
		}
	}
	return nil
}

func nodeText(node *htmlnode.Node) string {
	if node == nil {
		return ""
	}
	if node.Type == htmlnode.TextNode {
		return node.Data
	}
	if node.Type == htmlnode.ElementNode {
		switch node.Data {
		case "script", "style", "noscript", "svg":
			return ""
		}
	}
	var builder strings.Builder
	for child := node.FirstChild; child != nil; child = child.NextSibling {
		text := nodeText(child)
		if text == "" {
			continue
		}
		if builder.Len() > 0 {
			builder.WriteByte(' ')
		}
		builder.WriteString(text)
	}
	return spacePattern.ReplaceAllString(strings.TrimSpace(builder.String()), " ")
}

func nodeTextLength(node *htmlnode.Node) int {
	return len([]rune(nodeText(node)))
}

func nodeAttribute(node *htmlnode.Node, key string) string {
	if node == nil {
		return ""
	}
	for _, attr := range node.Attr {
		if strings.EqualFold(attr.Key, key) {
			return strings.TrimSpace(attr.Val)
		}
	}
	return ""
}

func setNodeAttribute(node *htmlnode.Node, key, value string) {
	for index := range node.Attr {
		if strings.EqualFold(node.Attr[index].Key, key) {
			node.Attr[index].Val = value
			return
		}
	}
	node.Attr = append(node.Attr, htmlnode.Attribute{Key: key, Val: value})
}

func setNodeAttributeIfMissing(node *htmlnode.Node, key, value string) {
	if nodeAttribute(node, key) == "" {
		setNodeAttribute(node, key, value)
	}
}

func removeNodeAttribute(node *htmlnode.Node, key string) {
	attrs := node.Attr[:0]
	for _, attr := range node.Attr {
		if !strings.EqualFold(attr.Key, key) {
			attrs = append(attrs, attr)
		}
	}
	node.Attr = attrs
}

func (s Syncer) fetchAllPages(ctx context.Context, source mediaWikiSource, namespace int, continueToken string, limit int) (allPagesResponse, error) {
	values := url.Values{}
	values.Set("action", "query")
	values.Set("generator", "allpages")
	values.Set("gapnamespace", fmt.Sprint(namespace))
	values.Set("gaplimit", fmt.Sprint(limit))
	if continueToken != "" {
		values.Set("gapcontinue", continueToken)
	}
	values.Set("prop", "info|revisions")
	values.Set("inprop", "url")
	values.Set("rvprop", "ids")
	values.Set("format", "json")
	values.Set("origin", "*")

	var out allPagesResponse
	err := s.getJSON(ctx, source.APIURL+"?"+values.Encode(), &out)
	return out, err
}

// ParsedWikiPage holds the result of parsing a MediaWiki page.
type ParsedWikiPage struct {
	Text       string
	HTML       string
	Categories []string
	Images     []string
	Templates  []string
}

func (s Syncer) fetchParsedPage(ctx context.Context, source mediaWikiSource, title string) (ParsedWikiPage, error) {
	values := url.Values{}
	values.Set("action", "parse")
	values.Set("page", title)
	values.Set("prop", "text|categories|images|templates")
	values.Set("format", "json")
	values.Set("origin", "*")

	var out parseResponse
	if err := s.getJSON(ctx, source.APIURL+"?"+values.Encode(), &out); err != nil {
		return ParsedWikiPage{}, err
	}
	cleanHTML := contentsecurity.SanitizeHTML(cleanWikiHTML(out.Parse.Text.HTML, source))
	return ParsedWikiPage{
		HTML: cleanHTML, Text: htmlToText(cleanHTML),
		Categories: cleanParseCategoryTitles(out.Parse.Categories),
		Images:     cleanParseImageTitles(out.Parse.Images),
		Templates:  cleanParseTemplateTitles(out.Parse.Templates),
	}, nil
}

func (s Syncer) getJSON(ctx context.Context, requestURL string, out any) error {
	if err := netsecurity.ValidateHTTPSURL(requestURL, allowedWikiHosts); err != nil {
		return err
	}
	client := s.HTTPClient
	if client == nil {
		client = netsecurity.NewSafeHTTPClient([]string{"maplestorywiki.net", "maplestory.fandom.com", "mapleclassic.wiki", "maplestorym-archive.fandom.com"}, 30*time.Second)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "MapleHubMirror/1.0")
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return fmt.Errorf("mediawiki request failed %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

func pageInputFromMediaWiki(source mediaWikiSource, page mwPage, parsed ParsedWikiPage) repo.WikiMirrorPageInput {
	categoryTags := uniqueStrings(append(cleanCategoryTitles(page.Categories), parsed.Categories...))
	category := ClassifyPage(page.Title, categoryTags, parsed.Text, page.NS)
	sourceURL := page.FullURL
	if sourceURL == "" {
		sourceURL = source.PageURLBase + url.PathEscape(strings.ReplaceAll(page.Title, " ", "_"))
	}
	var revisionID *int64
	if len(page.Revisions) > 0 {
		revisionID = &page.Revisions[0].Revid
	}
	var touchedAt *time.Time
	if page.Touched != "" {
		if parsedTime, err := time.Parse(time.RFC3339, page.Touched); err == nil {
			touchedAt = &parsedTime
		}
	}
	tags := append([]string{source.Name}, categoryTags...)
	tags = uniqueStrings(tags)

	return repo.WikiMirrorPageInput{
		SourceKey:      source.Key,
		SourcePageID:   page.PageID,
		Namespace:      page.NS,
		Title:          page.Title,
		Slug:           slugify(page.Title),
		Category:       category,
		SourceURL:      sourceURL,
		Extract:        firstText(parsed.Text, 220),
		ContentText:    parsed.Text,
		ContentHTML:    parsed.HTML,
		WordCount:      len(strings.Fields(parsed.Text)),
		RevisionID:     revisionID,
		TouchedAt:      touchedAt,
		Tags:           tags,
		AssetURLs:      extractImageURLs(parsed.HTML, source),
		TemplateTitles: uniqueStrings(append(cleanTemplateTitles(page.Templates), parsed.Templates...)),
	}
}

func cleanParseCategoryTitles(items []mwParseCategory) []string {
	var out []string
	for _, item := range items {
		title := strings.TrimPrefix(item.Title, "Category:")
		title = strings.ReplaceAll(title, "_", " ")
		if title == "" || strings.Contains(strings.ToLower(title), "pages using") || strings.Contains(strings.ToLower(title), "hidden") {
			continue
		}
		out = append(out, title)
	}
	return uniqueStrings(out)
}

func cleanParseImageTitles(items []string) []string {
	var out []string
	for _, item := range items {
		title := strings.TrimPrefix(item, "File:")
		title = strings.TrimSpace(title)
		if title != "" {
			out = append(out, title)
		}
	}
	return uniqueStrings(out)
}

func cleanParseTemplateTitles(items []mwParseTemplate) []string {
	var out []string
	for _, item := range items {
		title := strings.TrimPrefix(item.Title, "Template:")
		title = strings.TrimSpace(title)
		if title != "" {
			out = append(out, title)
		}
	}
	return uniqueStrings(out)
}

func cleanCategoryTitles(items []mwTitle) []string {
	var out []string
	for _, item := range items {
		title := strings.TrimPrefix(item.Title, "Category:")
		if title == "" || strings.Contains(strings.ToLower(title), "pages using") || strings.Contains(strings.ToLower(title), "hidden") {
			continue
		}
		out = append(out, title)
	}
	return uniqueStrings(out)
}

func cleanTemplateTitles(items []mwTitle) []string {
	var out []string
	for _, item := range items {
		title := strings.TrimPrefix(item.Title, "Template:")
		if title != "" {
			out = append(out, title)
		}
	}
	return uniqueStrings(out)
}

func ClassifyPage(title string, categories []string, content string, namespace int) string {
	if namespace == 6 {
		return "items"
	}
	if namespace == 14 {
		return "content"
	}

	titleText := strings.ToLower(title)
	categoryText := strings.ToLower(strings.Join(categories, " "))
	// Only use the first sentence of content for classification (not 500 chars)
	contentFirst := strings.ToLower(firstSentence(content))

	// --- Helpers ---

	// catHas checks if any MediaWiki category matches a pattern.
	catHas := func(patterns ...string) bool {
		for _, pattern := range patterns {
			if strings.Contains(categoryText, pattern) {
				return true
			}
		}
		return false
	}

	// catMatches checks individual category tags with suffix matching.
	// This avoids false positives like "Boss Reward Equipment" matching "boss".
	// It checks if any individual tag ends with or equals the given pattern.
	catMatches := func(patterns ...string) bool {
		for _, cat := range categories {
			lower := strings.ToLower(strings.TrimSpace(cat))
			for _, pattern := range patterns {
				if strings.HasSuffix(lower, pattern) || lower == pattern {
					return true
				}
			}
		}
		return false
	}

	// titleHas checks if the title contains a pattern.
	titleHas := func(patterns ...string) bool {
		for _, pattern := range patterns {
			if strings.Contains(titleText, pattern) {
				return true
			}
		}
		return false
	}

	// titleStartsWith checks if the title starts with a prefix.
	titleStartsWith := func(prefixes ...string) bool {
		for _, prefix := range prefixes {
			if strings.HasPrefix(titleText, prefix) {
				return true
			}
		}
		return false
	}

	// contentMentions checks if the first sentence of content mentions a keyword.
	contentMentions := func(keywords ...string) bool {
		for _, kw := range keywords {
			if strings.Contains(contentFirst, kw) {
				return true
			}
		}
		return false
	}

	// --- Story / Quest prefix detection ---
	// Pages like "(Alliance) ...", "(Aran) ...", "(Quest) ..." are story/quest chapters.
	// NOT all pages starting with '(' are story chapters — e.g. "(Pet Box)", "(Rare)" are items.
	storyPrefixes := []string{
		// Class-specific story arcs
		"(aran)", "(evan)", "(luminous)", "(mercedes)", "(phantom)", "(shade)",
		"(zero)", "(mihile)", "(kaiser)", "(angelic buster)", "(cadena)", "(illium)", "(ark)", "(hoyoung)",
		"(lara)", "(adele)", "(khali)", "(cygnus)", "(demon)", "(battle mage)", "(wild hunter)",
		"(mechanic)", "(xenon)", "(blaster)", "(kanna)", "(hayato)", "(beast tamer)", "(shadower)",
		"(dual blade)", "(resistance)", "(shine)", "(wind archer)", "(flame wizard)", "(thunder breaker)",
		"(night walker)", "(dawn warrior)", "(explorer)", "(warrior)", "(magician)", "(bowman)",
		"(thief)", "(pirate)", "(jett)", "(lynn)", "(mo xuan)", "(kain)", "(calibrate)",
		// Alliance / region story arcs
		"(alliance)", "(aftermath)", "(afterword)", "(genesis)", "(root abyss)",
		"(arcane river)", "(grandis)", "(maple alliance)",
		// General quest markers
		"(quest)",
		// Job progression (classified as classes elsewhere, but listed here for completeness)
		"(5th job)", "(6th job)", "(hexa)",
	}
	isStoryChapter := false
	for _, prefix := range storyPrefixes {
		if strings.HasPrefix(titleText, prefix) {
			isStoryChapter = true
			break
		}
	}

	// --- Boss name lists ---
	// Exact boss names that should be classified as bosses regardless of other signals.
	knownBossTitles := []string{
		"zakum", "chaos zakum",
		"horntail", "chaos horntail",
		"pink bean", "chaos pink bean",
		"pierre", "chaos pierre",
		"crimson queen", "chaos crimson queen",
		"vellum", "chaos vellum",
		"von leon",
		"arkarium",
		"hilla", "verus hilla",
		"magnus", "hard magnus",
		"lotus", "lotus (reanimated)",
		"damien",
		"lucid",
		"will",
		"gloom",
		"darknell",
		"seren",
		"kalos",
		"kaling", "karing",
		"black mage",
		"guardian angel slime",
		"limina",
		"black mage commanders",
	}

	// Check for exact boss title match (title == known boss name).
	isKnownBoss := false
	for _, boss := range knownBossTitles {
		if titleText == boss || strings.HasSuffix(titleText, "/monster") || strings.HasSuffix(titleText, "/monster (reanimated)") {
			isKnownBoss = true
			break
		}
	}

	// --- Classification rules in priority order ---

	// 0. Class progression prefixes (must be before story chapter detection)
	// Pages like "(5th Job) Call of the Erdas" start with '(' but are class pages.
	if titleStartsWith("(5th job)", "(6th job)", "(hexa)") {
		return "classes"
	}

	// 1. Exact known boss title match → bosses
	if isKnownBoss {
		return "bosses"
	}

	// 2. MediaWiki category-based classification (most reliable)
	// Use catMatches (suffix/exact on individual tags) for short words to avoid
	// substring false positives like "map" matching "MapleStory" or "class" matching "Classic".
	// Use catHas (substring) only for specific multi-word patterns.
	if catHas("patch notes", "update notes", "version history") {
		return "updates"
	}
	if catMatches("bosses", "boss") && !isStoryChapter {
		return "bosses"
	}
	if catMatches("quests", "quest") {
		return "quests"
	}
	if catMatches("npcs", "npc") {
		return "npcs"
	}
	if catMatches("classes", "class", "jobs", "skills") || catHas("job advancements") {
		return "classes"
	}
	if catMatches("monsters", "monster", "mob") {
		return "monsters"
	}
	if catMatches("maps", "map", "towns", "regions", "locations", "dungeons") {
		return "locations"
	}
	if catMatches("items", "item", "equipment", "weapons", "armor", "accessories", "potions", "scrolls", "chairs", "mounts") {
		return "items"
	}
	if catMatches("content", "systems", "events") || catHas("game mechanics") {
		return "content"
	}

	// 3. Title-pattern classification (before content matching)

	// Story chapters are quests/content, never bosses
	if isStoryChapter {
		// Class-specific story chapters
		if titleStartsWith("(aran)", "(evan)", "(luminous)", "(mercedes)", "(phantom)", "(shade)",
			"(zero)", "(mihile)", "(kaiser)", "(angelic buster)", "(cadena)", "(illium)", "(ark)", "(hoyoung)",
			"(lara)", "(adele)", "(khali)", "(cygnus)", "(demon)", "(battle mage)", "(wild hunter)",
			"(mechanic)", "(xenon)", "(blaster)", "(kanna)", "(hayato)", "(beast tamer)", "(shadower)",
			"(dual blade)", "(resistance)", "(shine)", "(wind archer)", "(flame wizard)", "(thunder breaker)",
			"(night walker)", "(dawn warrior)", "(aran)", "(shade)", "(luminous)", "(mercedes)", "(phantom)",
			"(explorer)", "(warrior)", "(magician)", "(bowman)", "(thief)", "(pirate)", "(jett)",
			"(lynn)", "(mo xuan)", "(angelic buster)", "(kain)", "(khali)", "(calibrate)") {
			return "quests"
		}
		// Alliance / region story chapters
		if titleStartsWith("(alliance)", "(aftermath)", "(afterword)", "(genesis)", "(root abyss)",
			"(arcane river)", "(grandis)", "(maple alliance)") {
			return "quests"
		}
		// Boss-specific story chapters (e.g. "(Horntail) The Last Hour of Horntail")
		// These are quest/story pages about bosses, not boss entries themselves
		return "quests"
	}

	// Title contains "Boss Rush" → these are skills/items, not bosses
	if titleHas("boss rush") {
		return "items"
	}

	// Updates from title pattern
	if titleStartsWith("version", "patch notes", "kms update", "gms update", "tms update", "jms update") {
		return "updates"
	}

	// Title-based boss detection removed — was too broad (e.g. "Zakum Helmet" matching "zakum").
	// Boss pages are reliably caught by knownBossTitles (exact match) + catMatches (MediaWiki category).

	// Classes from title
	if titleStartsWith("(5th job)", "(6th job)", "(hexa)") ||
		titleHas("job advancement", "class advancement", "skill book") {
		return "classes"
	}

	// Quests from title
	if titleHas("(quest)", "advancement quest", "pre-requisite", "quest chain") {
		return "quests"
	}

	// Items from title
	if titleStartsWith("(scroll)", "(starforce)", "(cube)", "(potential)") ||
		titleHas("scroll of", "chaos scroll", "miracle cube", "meister cube",
			"red cube", "black cube", "additional cube") {
		return "items"
	}

	// 4. First-sentence content matching (very conservative, last resort only)
	// Only match if the first sentence explicitly defines the page's type.
	if contentMentions("patch notes", "update log", "version update") {
		return "updates"
	}
	if contentMentions("is a boss", "boss fight", "boss battle", "is an endgame boss") && !isStoryChapter {
		return "bosses"
	}
	if contentMentions("is a quest", "quest rewards", "quest objective") {
		return "quests"
	}
	if contentMentions("is an npc", "npc located", "can be found in") && contentMentions("shop", "merchant", "vendor") {
		return "npcs"
	}
	if contentMentions("is a class", "job advancement", "can advance to") {
		return "classes"
	}
	if contentMentions("is a monster", "monster found in", "drops from") {
		return "monsters"
	}
	if contentMentions("is a location", "located in", "region of", "town in", "area in") {
		return "locations"
	}
	if contentMentions("is an item", "can be obtained", "equipment that", "weapon that") {
		return "items"
	}

	return "other"
}

// firstSentence extracts the first sentence from text (up to first period followed by space, or 200 chars).
func firstSentence(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	// Find the first sentence boundary (. ! ?) followed by a space or end of string
	runes := []rune(value)
	maxLen := 200
	if len(runes) < maxLen {
		maxLen = len(runes)
	}
	for i := 1; i < maxLen; i++ {
		if (runes[i] == '.' || runes[i] == '!' || runes[i] == '?') &&
			(i+1 >= len(runes) || runes[i+1] == ' ' || runes[i+1] == '\n') {
			return string(runes[:i+1])
		}
	}
	return string(runes[:maxLen])
}

func cleanWikiHTML(value string, source mediaWikiSource) string {
	value = tagsPattern.ReplaceAllString(value, "")
	value = editSectionPattern.ReplaceAllString(value, "")
	host := ""
	if parsed, err := url.Parse(source.PageURLBase); err == nil {
		host = parsed.Scheme + "://" + parsed.Host
	}
	if host != "" {
		value = strings.ReplaceAll(value, `href="/`, `href="`+host+`/`)
		value = strings.ReplaceAll(value, `src="/`, `src="`+host+`/`)
	}
	value = strings.ReplaceAll(value, `src="//`, `src="https://`)
	value = strings.ReplaceAll(value, `href="//`, `href="https://`)
	return value
}

func htmlToText(value string) string {
	value = tagsPattern.ReplaceAllString(value, " ")
	value = elementPattern.ReplaceAllString(value, " ")
	value = html.UnescapeString(value)
	value = spacePattern.ReplaceAllString(value, " ")
	return strings.TrimSpace(value)
}

func extractImageURLs(value string, source mediaWikiSource) []string {
	host := ""
	if parsed, err := url.Parse(source.PageURLBase); err == nil {
		host = parsed.Scheme + "://" + parsed.Host
	}
	matches := imgSrcPattern.FindAllStringSubmatch(value, -1)
	var out []string
	for _, match := range matches {
		if len(match) < 2 {
			continue
		}
		src := match[1]
		if strings.HasPrefix(src, "//") {
			src = "https:" + src
		} else if strings.HasPrefix(src, "/") && host != "" {
			src = host + src
		}
		out = append(out, src)
	}
	return uniqueStrings(out)
}

func firstText(value string, max int) string {
	value = strings.TrimSpace(value)
	if len([]rune(value)) <= max {
		return value
	}
	runes := []rune(value)
	return strings.TrimSpace(string(runes[:max])) + "..."
}

func uniqueStrings(values []string) []string {
	seen := map[string]struct{}{}
	var out []string
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		key := strings.ToLower(value)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, value)
	}
	return out
}

func slugify(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	value = strings.ReplaceAll(value, " ", "-")
	value = strings.ReplaceAll(value, "/", "-")
	return value
}
