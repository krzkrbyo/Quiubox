package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"quiubox/backend/internal/dto"
	"quiubox/backend/internal/models"
	"quiubox/backend/internal/repositories"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	users         *repositories.UserRepository
	sessions      *repositories.SessionRepository
	sessionDays   int
	sessionSecret string
}

func NewAuthService(users *repositories.UserRepository, sessions *repositories.SessionRepository, sessionDays int, sessionSecret string) *AuthService {
	return &AuthService{users: users, sessions: sessions, sessionDays: sessionDays, sessionSecret: sessionSecret}
}

func (s *AuthService) Register(req dto.RegisterRequest) error {
	if strings.TrimSpace(req.Username) == "" || strings.TrimSpace(req.Nombres) == "" || strings.TrimSpace(req.Apellidos) == "" || strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" {
		return errors.New("campos obligatorios incompletos")
	}

	if _, err := s.users.FindByUsername(req.Username); err == nil {
		return errors.New("username ya existe")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	if _, err := s.users.FindByEmail(req.Email); err == nil {
		return errors.New("email ya existe")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &models.Usuario{
		IDRol:        req.IDRol,
		Username:     req.Username,
		Nombres:      req.Nombres,
		Apellidos:    req.Apellidos,
		Email:        req.Email,
		PasswordHash: string(hash),
		Activo:       true,
	}

	return s.users.Create(user)
}

func (s *AuthService) Login(req dto.LoginRequest) (dto.LoginResponse, error) {
	user, err := s.users.FindByUsername(req.Username)
	if err != nil {
		return dto.LoginResponse{}, errors.New("credenciales inválidas")
	}

	if !user.Activo {
		return dto.LoginResponse{}, errors.New("usuario inactivo")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return dto.LoginResponse{}, errors.New("credenciales inválidas")
	}

	if err := s.sessions.DeactivateByUserID(user.IDUsuario); err != nil {
		return dto.LoginResponse{}, err
	}

	rawToken, err := randomToken(32)
	if err != nil {
		return dto.LoginResponse{}, err
	}

	now := time.Now()
	session := &models.Sesion{
		IDUsuario:       user.IDUsuario,
		TokenHash:       s.hashToken(rawToken),
		FechaInicio:     now,
		FechaExpiracion: now.Add(time.Duration(s.sessionDays) * 24 * time.Hour),
		Activa:          true,
	}

	if err := s.sessions.Create(session); err != nil {
		return dto.LoginResponse{}, err
	}

	return dto.LoginResponse{
		AccessToken: rawToken,
		User:        toUserResponse(user),
	}, nil
}

func randomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *AuthService) MeFromRequest(req *http.Request) (dto.UserResponse, error) {
	token, err := tokenFromRequest(req)
	if err != nil {
		return dto.UserResponse{}, err
	}

	session, err := s.sessions.FindActiveByTokenHash(s.hashToken(token))
	if err != nil {
		return dto.UserResponse{}, errors.New("sesión inválida")
	}

	user, err := s.users.FindByID(session.IDUsuario)
	if err != nil {
		return dto.UserResponse{}, errors.New("usuario no encontrado")
	}

	return toUserResponse(user), nil
}

func (s *AuthService) LogoutFromRequest(req *http.Request) error {
	token, err := tokenFromRequest(req)
	if err != nil {
		return err
	}
	return s.sessions.CloseByTokenHash(s.hashToken(token))
}

func (s *AuthService) hashToken(token string) string {
	sum := sha256.Sum256([]byte(s.sessionSecret + ":" + token))
	return hex.EncodeToString(sum[:])
}

func tokenFromRequest(req *http.Request) (string, error) {
	auth := strings.TrimSpace(req.Header.Get("Authorization"))
	if auth == "" {
		return "", errors.New("token requerido")
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(auth, prefix) {
		return "", errors.New("formato de token inválido")
	}
	token := strings.TrimSpace(strings.TrimPrefix(auth, prefix))
	if token == "" {
		return "", errors.New("token requerido")
	}
	return token, nil
}

func toUserResponse(user *models.Usuario) dto.UserResponse {
	role := "user"
	if strings.EqualFold(user.Rol.Nombre, "Administrador") || strings.EqualFold(user.Rol.Nombre, "admin") {
		role = "admin"
	}
	return dto.UserResponse{
		ID:       fmt.Sprintf("%d", user.IDUsuario),
		Username: user.Username,
		// Keep these fields so admin screens can display the full name if needed.
		// The frontend can ignore them when not present in a specific view.
		// They are included here to match the user entity shape.
		Nombres:   user.Nombres,
		Apellidos: user.Apellidos,
		Email:     user.Email,
		Role:      role,
	}
}
