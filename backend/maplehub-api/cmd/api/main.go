package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"

	"maplehub/internal/config"
	"maplehub/internal/db"
	"maplehub/internal/http/router"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	d, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer d.Close()

	app := router.New(router.Deps{Cfg: cfg, DB: d.Pool})

	log.Printf("listening on %s\n", cfg.Addr)
	if err := app.Listen(cfg.Addr); err != nil {
		// Fiber returns error on shutdown as well; keep it simple for skeleton
		_, _ = os.Stderr.WriteString(err.Error())
	}
}
