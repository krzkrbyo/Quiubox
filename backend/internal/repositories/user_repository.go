package repositories

import (
	"quiubox/backend/internal/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByUsername(username string) (*models.Usuario, error) {
	var user models.Usuario
	if err := r.db.Preload("Rol").Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByEmail(email string) (*models.Usuario, error) {
	var user models.Usuario
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByID(id uint) (*models.Usuario, error) {
	var user models.Usuario
	if err := r.db.Preload("Rol").First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) List() ([]models.Usuario, error) {
	var users []models.Usuario
	if err := r.db.Preload("Rol").Order("id_usuario desc").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) Create(user *models.Usuario) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) Update(user *models.Usuario) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Delete(id uint) error {
	return r.db.Delete(&models.Usuario{}, id).Error
}

func (r *UserRepository) FindRoleByName(name string) (*models.Rol, error) {
	var role models.Rol
	if err := r.db.Where("lower(nombre) = lower(?)", name).First(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *UserRepository) FindRoleByID(id uint) (*models.Rol, error) {
	var role models.Rol
	if err := r.db.First(&role, id).Error; err != nil {
		return nil, err
	}
	return &role, nil
}
