package netsecurity

import (
	"net"
	"testing"
)

func TestIsPublicIPRejectsSSRFAddressClasses(t *testing.T) {
	for _, value := range []string{"127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "0.0.0.0", "::1", "fc00::1", "fe80::1"} {
		if IsPublicIP(net.ParseIP(value)) {
			t.Fatalf("private/non-routable address accepted: %s", value)
		}
	}
	if !IsPublicIP(net.ParseIP("8.8.8.8")) {
		t.Fatal("public address rejected")
	}
}

func TestValidateHTTPSURLRejectsRedirectTargetsOutsideAllowlist(t *testing.T) {
	allowed := map[string]struct{}{"maplestorywiki.net": {}}
	valid := "https://maplestorywiki.net/api.php?action=query"
	if err := ValidateHTTPSURL(valid, allowed); err != nil {
		t.Fatal(err)
	}
	for _, value := range []string{
		"http://maplestorywiki.net/api.php", "https://127.0.0.1/api", "https://maplestorywiki.net.evil.example/api",
		"https://maplestorywiki.net:8443/api", "https://user@maplestorywiki.net/api",
	} {
		if err := ValidateHTTPSURL(value, allowed); err == nil {
			t.Fatalf("unsafe target accepted: %s", value)
		}
	}
}
