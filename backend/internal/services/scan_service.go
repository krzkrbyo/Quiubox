package services

import (
	"errors"
	"fmt"
	"net"
	"strconv"
	"strings"
	"time"

	"quiubox/backend/internal/dto"
	"quiubox/backend/internal/models"
	"quiubox/backend/internal/repositories"

	"gorm.io/gorm"
)

type ScanService struct {
	scans  *repositories.ScanRepository
	events *ScanEventHub
}

func NewScanService(scans *repositories.ScanRepository, events *ScanEventHub) *ScanService {
	return &ScanService{scans: scans, events: events}
}

func (s *ScanService) List() ([]dto.ScanResponse, error) {
	scans, err := s.scans.List()
	if err != nil {
		return nil, err
	}
	return s.mapScans(scans)
}

func (s *ScanService) ListCompleted(scanType string, from, to *time.Time) ([]dto.ScanResponse, error) {
	if scanType != "" && !validScanType(scanType) {
		return nil, errors.New("tipo de escaneo inválido")
	}
	scans, err := s.scans.ListCompleted(scanType, from, to)
	if err != nil {
		return nil, err
	}
	return s.mapScans(scans)
}

func (s *ScanService) Get(id uint) (dto.ScanResponse, error) {
	scan, err := s.scans.FindByID(id)
	if err != nil {
		return dto.ScanResponse{}, errors.New("escaneo no encontrado")
	}
	return s.toScanResponse(scan)
}

func (s *ScanService) Start(req dto.StartScanRequest) (dto.ScanResponse, error) {
	target := strings.TrimSpace(req.Target)
	scanType := normalizeScanType(req.ScanType)
	if target == "" {
		return dto.ScanResponse{}, errors.New("objetivo requerido")
	}
	if len(target) > 255 {
		return dto.ScanResponse{}, errors.New("objetivo demasiado largo")
	}
	if !validTarget(target) {
		return dto.ScanResponse{}, errors.New("objetivo inválido")
	}
	if !validScanType(scanType) {
		return dto.ScanResponse{}, errors.New("tipo de escaneo inválido")
	}

	userID, err := s.resolveUserID(req.UserID)
	if err != nil {
		return dto.ScanResponse{}, err
	}
	running, err := s.scans.FindStatusByName("Ejecutando")
	if err != nil {
		return dto.ScanResponse{}, errors.New("estado Ejecutando no existe")
	}

	scan := &models.Escaneo{
		IDUsuario:       userID,
		IDEstadoEscaneo: running.IDEstadoEscaneo,
		Objetivo:        target,
		TipoEscaneo:     scanType,
		Herramienta:     toolForScanType(scanType),
	}
	if err := s.scans.Create(scan); err != nil {
		return dto.ScanResponse{}, err
	}

	created, err := s.scans.FindByID(scan.IDEscaneo)
	if err != nil {
		return dto.ScanResponse{}, err
	}
	response, err := s.toScanResponse(created)
	if err != nil {
		return dto.ScanResponse{}, err
	}

	go s.runScan(created.IDEscaneo, target, scanType)
	return response, nil
}

func (s *ScanService) ListVulnerabilities(scanID uint) ([]dto.VulnerabilityResponse, error) {
	if _, err := s.scans.FindByID(scanID); err != nil {
		return nil, errors.New("escaneo no encontrado")
	}
	details, err := s.scans.ListDetails(scanID)
	if err != nil {
		return nil, err
	}
	out := make([]dto.VulnerabilityResponse, 0, len(details))
	for i := range details {
		out = append(out, toVulnerabilityResponse(&details[i]))
	}
	return out, nil
}

func (s *ScanService) GetVulnerability(scanID, detailID uint) (dto.VulnerabilityResponse, error) {
	detail, err := s.scans.FindDetail(scanID, detailID)
	if err != nil {
		return dto.VulnerabilityResponse{}, errors.New("vulnerabilidad no encontrada")
	}
	return toVulnerabilityResponse(detail), nil
}

func (s *ScanService) mapScans(scans []models.Escaneo) ([]dto.ScanResponse, error) {
	out := make([]dto.ScanResponse, 0, len(scans))
	for i := range scans {
		item, err := s.toScanResponse(&scans[i])
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func (s *ScanService) toScanResponse(scan *models.Escaneo) (dto.ScanResponse, error) {
	counts, err := s.scans.CountDetailsBySeverity(scan.IDEscaneo)
	if err != nil {
		return dto.ScanResponse{}, err
	}

	res := dto.ScanResponse{
		ID:        strconv.Itoa(int(scan.IDEscaneo)),
		Target:    scan.Objetivo,
		ScanType:  scan.TipoEscaneo,
		Status:    mapScanStatus(scan.EstadoEscaneo.Nombre),
		StartedAt: scan.FechaInicio.Format(time.RFC3339),
	}
	if scan.FechaFin != nil {
		res.FinishedAt = scan.FechaFin.Format(time.RFC3339)
	}
	for _, count := range counts {
		switch normalizeSeverity(count.Severity) {
		case "critical", "high":
			res.CriticalCount += count.Count
		case "medium":
			res.MediumCount += count.Count
		case "low":
			res.LowCount += count.Count
		}
	}
	return res, nil
}

func (s *ScanService) resolveUserID(raw string) (uint, error) {
	raw = strings.TrimSpace(raw)
	if raw != "" {
		id, err := strconv.Atoi(raw)
		if err != nil || id <= 0 {
			return 0, errors.New("userId inválido")
		}
		return uint(id), nil
	}
	id, err := s.scans.FirstActiveUserID()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, errors.New("no hay usuarios activos para asociar el escaneo")
		}
		return 0, err
	}
	return id, nil
}

func (s *ScanService) runScan(scanID uint, target, scanType string) {
	time.Sleep(30 * time.Second)

	if err := s.createSyntheticResult(scanID, target, scanType); err != nil {
		failed, statusErr := s.scans.FindStatusByName("Error")
		if statusErr == nil {
			now := time.Now()
			msg := "falló la ejecución del escaneo"
			_ = s.scans.UpdateStatus(scanID, failed.IDEstadoEscaneo, &now, &msg)
		}
		return
	}

	finished, err := s.scans.FindStatusByName("Finalizado")
	if err != nil {
		return
	}
	now := time.Now()
	msg := "Ejecución finalizada correctamente"
	if err := s.scans.UpdateStatus(scanID, finished.IDEstadoEscaneo, &now, &msg); err != nil {
		return
	}

	scan, err := s.scans.FindByID(scanID)
	if err != nil {
		return
	}
	response, err := s.toScanResponse(scan)
	if err != nil {
		return
	}
	s.events.Publish(dto.ScanFinishedEvent{
		Type:          "scan.finished",
		ScanID:        response.ID,
		Status:        response.Status,
		CriticalCount: response.CriticalCount,
		MediumCount:   response.MediumCount,
		LowCount:      response.LowCount,
		Scan:          response,
	})
}

func (s *ScanService) createSyntheticResult(scanID uint, target, scanType string) error {
	severityName := "Media"
	cvss := 5.3
	port := 80
	protocol := "tcp"
	title := "Servicio HTTP detectado"
	description := fmt.Sprintf("El escaneo %s identificó un servicio expuesto en %s.", scanType, target)
	solution := "Revisar que el servicio expuesto sea necesario, aplicar parches y restringir el acceso cuando corresponda."
	if scanType == "openvas" || scanType == "combined" {
		severityName = "Alta"
		cvss = 7.5
		title = "Vulnerabilidad simulada de servicio expuesto"
	}

	severity, err := s.scans.FindSeverityByName(severityName)
	if err != nil {
		return err
	}
	hostIP := target
	if ip := net.ParseIP(target); ip == nil {
		hostIP = "127.0.0.1"
	}
	hostState := "up"
	host := &models.Host{
		IDEscaneo:  scanID,
		IP:         hostIP,
		EstadoHost: &hostState,
	}
	source := "Quiubox"
	recommendation := &models.Recomendacion{
		Titulo:      "Mitigar exposición innecesaria",
		Descripcion: solution,
		Fuente:      &source,
	}
	detail := &models.DetalleEscaneo{
		IDEscaneo:            scanID,
		IDSeveridad:          severity.IDSeveridad,
		NombreVulnerabilidad: title,
		Descripcion:          &description,
		Puerto:               &port,
		Protocolo:            &protocol,
		CVSS:                 &cvss,
		Solucion:             &solution,
	}
	return s.scans.CreateScanResult(host, detail, recommendation)
}

func normalizeScanType(scanType string) string {
	return strings.ToLower(strings.TrimSpace(scanType))
}

func validScanType(scanType string) bool {
	switch scanType {
	case "nmap", "openvas", "combined":
		return true
	default:
		return false
	}
}

func validTarget(target string) bool {
	if net.ParseIP(target) != nil {
		return true
	}
	if _, _, err := net.ParseCIDR(target); err == nil {
		return true
	}
	if len(target) > 253 || strings.ContainsAny(target, " \t\r\n/\\") {
		return false
	}
	parts := strings.Split(target, ".")
	for _, part := range parts {
		if part == "" || len(part) > 63 {
			return false
		}
		for _, r := range part {
			if (r < 'a' || r > 'z') && (r < 'A' || r > 'Z') && (r < '0' || r > '9') && r != '-' {
				return false
			}
		}
	}
	return true
}

func toolForScanType(scanType string) string {
	switch scanType {
	case "nmap":
		return "Nmap"
	case "openvas":
		return "OpenVAS"
	default:
		return "Nmap/OpenVAS"
	}
}

func mapScanStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "pendiente":
		return "queued"
	case "ejecutando":
		return "running"
	case "finalizado":
		return "completed"
	case "error":
		return "failed"
	default:
		return strings.ToLower(strings.TrimSpace(status))
	}
}

func normalizeSeverity(severity string) string {
	switch strings.ToLower(strings.TrimSpace(severity)) {
	case "crítica", "critica", "critical":
		return "critical"
	case "alta", "high":
		return "high"
	case "media", "medium":
		return "medium"
	case "baja", "low":
		return "low"
	default:
		return "low"
	}
}

func toVulnerabilityResponse(detail *models.DetalleEscaneo) dto.VulnerabilityResponse {
	res := dto.VulnerabilityResponse{
		ID:       strconv.Itoa(int(detail.IDDetalle)),
		ScanID:   strconv.Itoa(int(detail.IDEscaneo)),
		Title:    detail.NombreVulnerabilidad,
		Severity: normalizeSeverity(detail.Severidad.Nombre),
		Summary:  stringValue(detail.Descripcion),
	}
	if detail.CVE != nil {
		res.CVE = *detail.CVE
		res.NVD = &dto.NVDDetails{
			CVEID:        *detail.CVE,
			CVSSScore:    detail.CVSS,
			Description:  stringValue(detail.Descripcion),
			ReferenceURL: "https://nvd.nist.gov/vuln/detail/" + *detail.CVE,
		}
	}
	if detail.Recomendacion != nil {
		res.Recommendations = append(res.Recommendations, dto.MitigationRecommendation{
			ID:          strconv.Itoa(int(detail.Recomendacion.IDRecomendacion)),
			Title:       detail.Recomendacion.Titulo,
			Description: detail.Recomendacion.Descripcion,
		})
	} else if detail.Solucion != nil {
		res.Recommendations = append(res.Recommendations, dto.MitigationRecommendation{
			ID:          "scan-detail-" + strconv.Itoa(int(detail.IDDetalle)),
			Title:       "Recomendación",
			Description: *detail.Solucion,
		})
	}
	return res
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
