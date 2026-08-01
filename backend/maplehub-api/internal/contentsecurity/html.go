package contentsecurity

import (
	"encoding/json"
	"errors"
	"net/url"
	"strings"

	"github.com/microcosm-cc/bluemonday"
)

var allowedSourceHosts = map[string]struct{}{
	"api.steampowered.com":   {},
	"g.nexonstatic.com":      {},
	"grandislibrary.com":     {},
	"gucciguild.com":         {},
	"en.namu.wiki":           {},
	"maplestory.nexon.net":   {},
	"maplestory.fandom.com":  {},
	"maplestorywiki.net":     {},
	"store.steampowered.com": {},
	"www.grandislibrary.com": {},
	"www.gucciguild.com":     {},
	"www.nexon.com":          {},
	"www.maplestorywiki.net": {},
}

func htmlPolicy() *bluemonday.Policy {
	p := bluemonday.NewPolicy()
	p.AllowElements(
		"a", "abbr", "b", "blockquote", "br", "caption", "cite", "code", "col", "colgroup",
		"dd", "del", "details", "dfn", "div", "dl", "dt", "em", "figcaption", "figure",
		"h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd", "li", "main",
		"mark", "ol", "p", "pre", "q", "s", "samp", "section", "small", "span", "strong",
		"sub", "summary", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr",
		"u", "ul", "var", "wbr",
	)
	p.AllowAttrs("class", "id", "title", "lang", "dir").Globally()
	p.AllowAttrs("href", "target", "rel").OnElements("a")
	p.AllowAttrs("src", "alt", "width", "height", "loading").OnElements("img")
	p.AllowAttrs("colspan", "rowspan", "scope", "headers").OnElements("td", "th")
	p.AllowAttrs("span", "width").OnElements("col", "colgroup")
	p.AllowAttrs("datetime").OnElements("time", "ins", "del")
	p.AllowURLSchemes("https")
	p.AllowRelativeURLs(true)
	p.RequireNoFollowOnLinks(true)
	p.RequireNoReferrerOnLinks(true)
	p.AddTargetBlankToFullyQualifiedLinks(true)
	return p
}

func SanitizeHTML(input string) string {
	return strings.TrimSpace(htmlPolicy().Sanitize(input))
}

func ValidateSourceURL(value string) error {
	parsed, err := url.Parse(strings.TrimSpace(value))
	if err != nil || parsed.Scheme != "https" || parsed.User != nil || parsed.Hostname() == "" {
		return errors.New("source_url must be an HTTPS URL without credentials")
	}
	if parsed.Port() != "" && parsed.Port() != "443" {
		return errors.New("source_url port is not allowed")
	}
	if _, ok := allowedSourceHosts[strings.ToLower(parsed.Hostname())]; !ok {
		return errors.New("source_url host is not allowlisted")
	}
	return nil
}

func SanitizeHTMLFields(raw json.RawMessage) (json.RawMessage, error) {
	if len(raw) == 0 {
		return json.RawMessage(`{}`), nil
	}
	var value any
	if err := json.Unmarshal(raw, &value); err != nil {
		return nil, err
	}
	var visit func(any)
	visit = func(node any) {
		switch typed := node.(type) {
		case map[string]any:
			for key, child := range typed {
				normalized := strings.ToLower(strings.ReplaceAll(key, "_", ""))
				if normalized == "contenthtml" || normalized == "htmlcontent" {
					if html, ok := child.(string); ok {
						typed[key] = SanitizeHTML(html)
					}
					continue
				}
				visit(child)
			}
		case []any:
			for _, child := range typed {
				visit(child)
			}
		}
	}
	visit(value)
	return json.Marshal(value)
}
