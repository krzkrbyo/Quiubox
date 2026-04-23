package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerAddress   string
	DatabaseURL     string
	CorsAllowedOrig string
	SessionDays     string
	SessionSecret   string
}

func Load() Config {
	_ = godotenv.Load()

	cfg := Config{
		ServerAddress:   getEnv("SERVER_ADDRESS", ":8081"),
		DatabaseURL:     getEnv("DATABASE_URL", "host=localhost port=5432 dbname=quiuboxdb user=postgres password=root connect_timeout=10 sslmode=prefer"),
		CorsAllowedOrig: getEnv("CORS_ALLOWED_ORIGIN", "http://localhost:4200"),
		SessionDays:     getEnv("SESSION_DAYS", "7"),
		SessionSecret:   getEnv("SESSION_SECRET", "quiubox-session-secret"),
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
