package main

import (
	"log"
	"net/http"

	"quiubox/backend/internal/config"
	"quiubox/backend/internal/database"
	"quiubox/backend/internal/httpapi"
)

func main() {
	cfg := config.Load()

	db, err := database.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	router := httpapi.NewRouter(db, cfg)

	addr := cfg.ServerAddress
	log.Printf("server listening on %s", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
