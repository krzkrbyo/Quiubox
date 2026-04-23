package repositories

import (
	"time"

	"quiubox/backend/internal/models"

	"gorm.io/gorm"
)

type SessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

func (r *SessionRepository) Create(session *models.Sesion) error {
	return r.db.Create(session).Error
}

func (r *SessionRepository) DeactivateByUserID(userID uint) error {
	return r.db.Model(&models.Sesion{}).
		Where("id_usuario = ? AND activa = true", userID).
		Updates(map[string]any{"activa": false}).Error
}

func (r *SessionRepository) FindActiveByTokenHash(tokenHash string) (*models.Sesion, error) {
	var session models.Sesion
	now := time.Now()
	if err := r.db.Where("token_hash = ? AND activa = true AND fecha_expiracion > ?", tokenHash, now).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *SessionRepository) CloseByTokenHash(tokenHash string) error {
	now := time.Now()
	return r.db.Model(&models.Sesion{}).
		Where("token_hash = ? AND activa = true", tokenHash).
		Updates(map[string]any{
			"activa":       false,
			"fecha_cierre": now,
		}).Error
}
