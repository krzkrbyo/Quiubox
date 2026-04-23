package repositories

import (
	"time"

	"quiubox/backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ScanRepository struct {
	db *gorm.DB
}

type SeverityCount struct {
	Severity string
	Count    int64
}

func NewScanRepository(db *gorm.DB) *ScanRepository {
	return &ScanRepository{db: db}
}

func (r *ScanRepository) List() ([]models.Escaneo, error) {
	var scans []models.Escaneo
	err := r.db.Preload("EstadoEscaneo").Order("fecha_inicio desc").Find(&scans).Error
	return scans, err
}

func (r *ScanRepository) ListCompleted(scanType string, from, to *time.Time) ([]models.Escaneo, error) {
	query := r.db.Preload("EstadoEscaneo").
		Joins("JOIN estado_escaneo ee ON ee.id_estado_escaneo = escaneo.id_estado_escaneo").
		Where("lower(ee.nombre) = lower(?)", "Finalizado")
	if scanType != "" {
		query = query.Where("tipo_escaneo = ?", scanType)
	}
	if from != nil {
		query = query.Where("fecha_fin >= ?", *from)
	}
	if to != nil {
		query = query.Where("fecha_fin <= ?", *to)
	}

	var scans []models.Escaneo
	err := query.Order("fecha_fin desc").Find(&scans).Error
	return scans, err
}

func (r *ScanRepository) FindByID(id uint) (*models.Escaneo, error) {
	var scan models.Escaneo
	err := r.db.Preload("EstadoEscaneo").First(&scan, id).Error
	return &scan, err
}

func (r *ScanRepository) Create(scan *models.Escaneo) error {
	return r.db.Create(scan).Error
}

func (r *ScanRepository) UpdateStatus(id, statusID uint, finishedAt *time.Time, observations *string) error {
	return r.db.Model(&models.Escaneo{}).
		Where("id_escaneo = ?", id).
		Updates(map[string]any{
			"id_estado_escaneo": statusID,
			"fecha_fin":         finishedAt,
			"observaciones":     observations,
		}).Error
}

func (r *ScanRepository) FindStatusByName(name string) (*models.EstadoEscaneo, error) {
	var status models.EstadoEscaneo
	err := r.db.Where("lower(nombre) = lower(?)", name).First(&status).Error
	return &status, err
}

func (r *ScanRepository) FindSeverityByName(name string) (*models.Severidad, error) {
	var severity models.Severidad
	err := r.db.Where("lower(nombre) = lower(?)", name).First(&severity).Error
	return &severity, err
}

func (r *ScanRepository) FirstActiveUserID() (uint, error) {
	var user models.Usuario
	err := r.db.Select("id_usuario").Where("activo = ?", true).Order("id_usuario asc").First(&user).Error
	return user.IDUsuario, err
}

func (r *ScanRepository) CreateScanResult(host *models.Host, detail *models.DetalleEscaneo, recommendation *models.Recomendacion) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(host).Error; err != nil {
			return err
		}

		var existing models.Recomendacion
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("titulo = ?", recommendation.Titulo).
			First(&existing).Error
		if err != nil {
			if err != gorm.ErrRecordNotFound {
				return err
			}
			if err := tx.Create(recommendation).Error; err != nil {
				return err
			}
			detail.IDRecomendacion = &recommendation.IDRecomendacion
		} else {
			detail.IDRecomendacion = &existing.IDRecomendacion
		}

		detail.IDHost = host.IDHost
		return tx.Create(detail).Error
	})
}

func (r *ScanRepository) CountDetailsBySeverity(scanID uint) ([]SeverityCount, error) {
	var rows []SeverityCount
	err := r.db.Table("detalle_escaneo de").
		Select("s.nombre AS severity, count(*) AS count").
		Joins("JOIN severidad s ON s.id_severidad = de.id_severidad").
		Where("de.id_escaneo = ?", scanID).
		Group("s.nombre").
		Scan(&rows).Error
	return rows, err
}

func (r *ScanRepository) ListDetails(scanID uint) ([]models.DetalleEscaneo, error) {
	var details []models.DetalleEscaneo
	err := r.db.Preload("Severidad").
		Preload("Recomendacion").
		Preload("Host").
		Where("id_escaneo = ?", scanID).
		Order("id_detalle desc").
		Find(&details).Error
	return details, err
}

func (r *ScanRepository) FindDetail(scanID, detailID uint) (*models.DetalleEscaneo, error) {
	var detail models.DetalleEscaneo
	err := r.db.Preload("Severidad").
		Preload("Recomendacion").
		Preload("Host").
		Where("id_escaneo = ? AND id_detalle = ?", scanID, detailID).
		First(&detail).Error
	return &detail, err
}
