package httpapi

import (
	"net/http"
	"strconv"

	"quiubox/backend/internal/config"
	"quiubox/backend/internal/httpapi/handlers"
	"quiubox/backend/internal/repositories"
	"quiubox/backend/internal/services"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func NewRouter(gdb *gorm.DB, cfg config.Config) http.Handler {
	userRepo := repositories.NewUserRepository(gdb)
	sessionRepo := repositories.NewSessionRepository(gdb)
	sessionDays, _ := strconv.Atoi(cfg.SessionDays)
	authService := services.NewAuthService(userRepo, sessionRepo, sessionDays, cfg.SessionSecret)
	authHandler := handlers.NewAuthHandler(authService)
	userService := services.NewUserService(userRepo)
	usersHandler := handlers.NewUsersHandler(userService)

	r := mux.NewRouter()
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}).Methods(http.MethodGet)

	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/auth/register", authHandler.Register).Methods(http.MethodPost)
	api.HandleFunc("/auth/login", authHandler.Login).Methods(http.MethodPost)
	api.HandleFunc("/auth/logout", authHandler.Logout).Methods(http.MethodPost)
	api.HandleFunc("/auth/me", authHandler.Me).Methods(http.MethodGet)
	api.HandleFunc("/users", usersHandler.List).Methods(http.MethodGet)
	api.HandleFunc("/users", usersHandler.Create).Methods(http.MethodPost)
	api.HandleFunc("/users/{id}", usersHandler.Update).Methods(http.MethodPatch)
	api.HandleFunc("/users/{id}", usersHandler.Delete).Methods(http.MethodDelete)

	return corsMiddleware(r, cfg.CorsAllowedOrig)
}

func corsMiddleware(next http.Handler, allowedOrigin string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && (origin == allowedOrigin || allowedOrigin == "*") {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
