package config

import (
	"os"
	"strconv"
)

type Config struct {
	Env     string
	Addr    string
	BaseURL string

	DatabaseURL string

	JWTSecret       string
	JWTIssuer       string
	JWTAccessTTLMin int
	GoogleClientID  string

	CORSAllowOrigins     string
	AnalyticsHashSecret  string
	TranslationProvider  string
	DeepLAuthKey         string
	DeepLAPIURL          string
	LibreTranslateAPIURL string
	LibreTranslateAPIKey string
	OllamaAPIURL         string
	OllamaModel          string
}

func getEnv(key, def string) string {
	val := os.Getenv(key)
	if val == "" {
		return def
	}
	return val
}

func getEnvInt(key string, def int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return def
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return def
	}
	return n
}

func Load() Config {
	return Config{
		Env:     getEnv("APP_ENV", "dev"),
		Addr:    getEnv("APP_ADDR", "0.0.0.0:8080"),
		BaseURL: getEnv("APP_BASE_URL", "http://localhost:8080"),

		DatabaseURL: getEnv("DATABASE_URL", ""),

		JWTSecret:       getEnv("JWT_SECRET", ""),
		JWTIssuer:       getEnv("JWT_ISSUER", "maplehub"),
		JWTAccessTTLMin: getEnvInt("JWT_ACCESS_TTL_MIN", 30),
		GoogleClientID:  getEnv("GOOGLE_CLIENT_ID", "146017234212-3rlmu2u16hmdru86a6pjjog6sr0cr9a5.apps.googleusercontent.com"),

		CORSAllowOrigins:     getEnv("CORS_ALLOW_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"),
		AnalyticsHashSecret:  getEnv("ANALYTICS_HASH_SECRET", getEnv("JWT_SECRET", "")),
		TranslationProvider:  getEnv("TRANSLATION_PROVIDER", "deepl"),
		DeepLAuthKey:         getEnv("DEEPL_AUTH_KEY", ""),
		DeepLAPIURL:          getEnv("DEEPL_API_URL", "https://api-free.deepl.com/v2/translate"),
		LibreTranslateAPIURL: getEnv("LIBRETRANSLATE_API_URL", "http://127.0.0.1:5000/translate"),
		LibreTranslateAPIKey: getEnv("LIBRETRANSLATE_API_KEY", ""),
		OllamaAPIURL:         getEnv("OLLAMA_API_URL", "http://127.0.0.1:11434"),
		OllamaModel:          getEnv("OLLAMA_MODEL", "gemma3:1b"),
	}
}
