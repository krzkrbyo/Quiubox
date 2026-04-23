package services

import (
	"errors"
	"strings"

	"quiubox/backend/internal/dto"
	"quiubox/backend/internal/models"
	"quiubox/backend/internal/repositories"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	users *repositories.UserRepository
}

func NewUserService(users *repositories.UserRepository) *UserService {
	return &UserService{users: users}
}

func (s *UserService) List() ([]dto.UserResponse, error) {
	users, err := s.users.List()
	if err != nil {
		return nil, err
	}
	out := make([]dto.UserResponse, 0, len(users))
	for i := range users {
		out = append(out, toUserResponse(&users[i]))
	}
	return out, nil
}

func (s *UserService) Create(req dto.CreateUserRequest) (dto.UserResponse, error) {
	if strings.TrimSpace(req.Username) == "" || strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" {
		return dto.UserResponse{}, errors.New("campos obligatorios incompletos")
	}

	if _, err := s.users.FindByUsername(req.Username); err == nil {
		return dto.UserResponse{}, errors.New("username ya existe")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return dto.UserResponse{}, err
	}

	if _, err := s.users.FindByEmail(req.Email); err == nil {
		return dto.UserResponse{}, errors.New("email ya existe")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return dto.UserResponse{}, err
	}

	role, err := s.users.FindRoleByName(normalizeRoleName(req.Role))
	if err != nil {
		return dto.UserResponse{}, errors.New("rol inválido")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return dto.UserResponse{}, err
	}

	user := &models.Usuario{
		IDRol:        role.IDRol,
		Username:     strings.TrimSpace(req.Username),
		Nombres:      strings.TrimSpace(req.Nombres),
		Apellidos:    strings.TrimSpace(req.Apellidos),
		Email:        strings.TrimSpace(req.Email),
		PasswordHash: string(hash),
		Activo:       true,
	}

	if user.Nombres == "" {
		user.Nombres = user.Username
	}
	if user.Apellidos == "" {
		user.Apellidos = "Usuario"
	}

	if err := s.users.Create(user); err != nil {
		return dto.UserResponse{}, err
	}

	created, err := s.users.FindByID(user.IDUsuario)
	if err != nil {
		return dto.UserResponse{}, err
	}
	return toUserResponse(created), nil
}

func (s *UserService) Update(id uint, req dto.UpdateUserRequest) (dto.UserResponse, error) {
	user, err := s.users.FindByID(id)
	if err != nil {
		return dto.UserResponse{}, errors.New("usuario no encontrado")
	}

	if strings.TrimSpace(req.Email) != "" {
		user.Email = strings.TrimSpace(req.Email)
	}
	if strings.TrimSpace(req.Nombres) != "" {
		user.Nombres = strings.TrimSpace(req.Nombres)
	}
	if strings.TrimSpace(req.Apellidos) != "" {
		user.Apellidos = strings.TrimSpace(req.Apellidos)
	}
	if req.Activo != nil {
		user.Activo = *req.Activo
	}
	if strings.TrimSpace(req.Role) != "" {
		role, err := s.users.FindRoleByName(normalizeRoleName(req.Role))
		if err != nil {
			return dto.UserResponse{}, errors.New("rol inválido")
		}
		user.IDRol = role.IDRol
		user.Rol = *role
	}

	if err := s.users.Update(user); err != nil {
		return dto.UserResponse{}, err
	}

	updated, err := s.users.FindByID(id)
	if err != nil {
		return dto.UserResponse{}, err
	}
	return toUserResponse(updated), nil
}

func (s *UserService) Delete(id uint) error {
	return s.users.Delete(id)
}

func normalizeRoleName(role string) string {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "admin", "administrador":
		return "Administrador"
	case "user", "usuario":
		return "Usuario"
	default:
		return strings.TrimSpace(role)
	}
}
