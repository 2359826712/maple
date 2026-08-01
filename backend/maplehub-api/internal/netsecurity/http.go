package netsecurity

import (
	"context"
	"crypto/tls"
	"errors"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

func IsPublicIP(ip net.IP) bool {
	return ip != nil && !ip.IsLoopback() && !ip.IsPrivate() && !ip.IsLinkLocalUnicast() &&
		!ip.IsLinkLocalMulticast() && !ip.IsMulticast() && !ip.IsUnspecified()
}

func ValidateHTTPSURL(rawURL string, allowedHosts map[string]struct{}) error {
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme != "https" || parsed.User != nil || parsed.Hostname() == "" {
		return errors.New("URL must use HTTPS without credentials")
	}
	if parsed.Port() != "" && parsed.Port() != "443" {
		return errors.New("URL port is not allowed")
	}
	if _, ok := allowedHosts[strings.ToLower(parsed.Hostname())]; !ok {
		return errors.New("URL host is not allowlisted")
	}
	return nil
}

func NewSafeHTTPClient(hosts []string, timeout time.Duration) *http.Client {
	allowedHosts := make(map[string]struct{}, len(hosts))
	for _, host := range hosts {
		allowedHosts[strings.ToLower(host)] = struct{}{}
	}
	dialer := &net.Dialer{Timeout: 10 * time.Second, KeepAlive: 30 * time.Second}
	transport := &http.Transport{
		Proxy:           nil,
		TLSClientConfig: &tls.Config{MinVersion: tls.VersionTLS12},
		DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
			host, port, err := net.SplitHostPort(address)
			if err != nil {
				return nil, err
			}
			if _, ok := allowedHosts[strings.ToLower(host)]; !ok {
				return nil, errors.New("dial host is not allowlisted")
			}
			ips, err := net.DefaultResolver.LookupIP(ctx, "ip", host)
			if err != nil {
				return nil, err
			}
			for _, ip := range ips {
				if !IsPublicIP(ip) {
					return nil, errors.New("resolved private or non-routable address rejected")
				}
			}
			if len(ips) == 0 {
				return nil, errors.New("host resolved without addresses")
			}
			return dialer.DialContext(ctx, network, net.JoinHostPort(ips[0].String(), port))
		},
	}
	return &http.Client{
		Timeout:   timeout,
		Transport: transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return errors.New("too many redirects")
			}
			return ValidateHTTPSURL(req.URL.String(), allowedHosts)
		},
	}
}
