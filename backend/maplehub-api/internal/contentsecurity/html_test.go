package contentsecurity

import (
	"encoding/json"
	"strings"
	"testing"

	"golang.org/x/net/html"
)

func TestSanitizeHTMLRemovesExecutableContentAndUnsafeProtocols(t *testing.T) {
	input := `<p onclick="alert(1)">Safe</p><script>alert(2)</script><iframe src="https://example.com"></iframe>` +
		`<a href="javascript:alert(3)">bad</a><img src="data:text/html,boom"><a href="https://maplestorywiki.net/w/Test">good</a><a href="/wiki/Test">relative</a>`
	output := SanitizeHTML(input)
	for _, forbidden := range []string{"onclick", "<script", "<iframe", "javascript:", "data:"} {
		if strings.Contains(strings.ToLower(output), forbidden) {
			t.Fatalf("output retained %q: %s", forbidden, output)
		}
	}
	if !strings.Contains(output, "https://maplestorywiki.net/w/Test") || !strings.Contains(output, "/wiki/Test") {
		t.Fatalf("safe links removed: %s", output)
	}
}

func TestSanitizeHTMLNeutralizesOWASPEvasionClasses(t *testing.T) {
	payloads := []string{
		`<SCRIPT SRC="https://example.com/x.js"></SCRIPT>`,
		`javascript:</title></style></textarea></script><svg onload="alert(1)">`,
		`<a onmouseover="alert(document.cookie)">link</a>`,
		`<IMG ""><SCRIPT>alert("XSS")</SCRIPT>">`,
		`<a href="javascript:alert(String.fromCharCode(88,83,83))">click</a>`,
		`<img src="#" onmouseover="alert(1)">`,
		`<img src="" onerror="alert(1)">`,
		`<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">encoded</a>`,
		`<a href="jav&#x09;ascript:alert(1)">tab</a>`,
		`<base href="javascript:alert(1)//">`,
		`<object data="https://example.com/xss.html"></object>`,
		`<embed src="data:image/svg+xml;base64,PHN2Zz4=">`,
		`<xml id="x"><img src="javascript:alert(1)"></xml>`,
		`<video><source onerror="alert(1)"></video>`,
		`<iframe src="data:text/html,<svg onload=alert(1)>"></iframe>`,
		`<meta http-equiv="refresh" content="0;url=javascript:alert(1)">`,
		`<math><mtext><a href="javascript:alert(1)">math</a></mtext></math>`,
	}
	for _, payload := range payloads {
		output := SanitizeHTML(payload)
		document, err := html.Parse(strings.NewReader(output))
		if err != nil {
			t.Fatal(err)
		}
		var inspect func(*html.Node)
		inspect = func(node *html.Node) {
			if node.Type == html.ElementNode {
				forbidden := map[string]bool{"script": true, "style": true, "svg": true, "math": true, "iframe": true, "object": true, "embed": true, "form": true, "input": true, "video": true, "audio": true, "applet": true, "xml": true, "meta": true, "base": true}
				if forbidden[strings.ToLower(node.Data)] {
					t.Errorf("forbidden element %s survived payload %q", node.Data, payload)
				}
				for _, attribute := range node.Attr {
					name := strings.ToLower(attribute.Key)
					if strings.HasPrefix(name, "on") {
						t.Errorf("event handler %s survived payload %q", name, payload)
					}
					if name == "href" || name == "src" || name == "cite" {
						value := strings.ToLower(strings.TrimSpace(attribute.Val))
						if strings.HasPrefix(value, "javascript:") || strings.HasPrefix(value, "data:") || strings.HasPrefix(value, "vbscript:") {
							t.Errorf("unsafe URL survived payload %q: %s", payload, value)
						}
					}
				}
			}
			for child := node.FirstChild; child != nil; child = child.NextSibling {
				inspect(child)
			}
		}
		inspect(document)
	}
}

func TestSanitizeHTMLFieldsCleansNestedPayloads(t *testing.T) {
	raw := json.RawMessage(`{"guide":{"contentHtml":"<b>safe</b><script>bad</script>"},"items":[{"html_content":"<img src=\"data:text/html,bad\">"}]}`)
	output, err := SanitizeHTMLFields(raw)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(strings.ToLower(string(output)), "script") || strings.Contains(strings.ToLower(string(output)), "data:") {
		t.Fatalf("unsafe nested HTML retained: %s", output)
	}
}

func TestValidateSourceURLUsesExactHTTPSAllowlist(t *testing.T) {
	valid := []string{
		"https://maplestorywiki.net/w/Test",
		"https://grandislibrary.com/content",
		"https://en.namu.wiki/w/%EB%A9%94%EC%9D%B4%ED%94%8C%EC%8A%A4%ED%86%A0%EB%A6%ACM",
	}
	for _, value := range valid {
		if err := ValidateSourceURL(value); err != nil {
			t.Fatalf("valid URL rejected: %s: %v", value, err)
		}
	}
	invalid := []string{
		"http://maplestorywiki.net/w/Test", "https://evil.example/", "https://maplestorywiki.net.evil.example/",
		"https://user:pass@maplestorywiki.net/w/Test", "https://maplestorywiki.net:8443/w/Test",
	}
	for _, value := range invalid {
		if err := ValidateSourceURL(value); err == nil {
			t.Fatalf("invalid URL accepted: %s", value)
		}
	}
}
