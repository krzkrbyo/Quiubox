package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"quiubox/backend/internal/dto"
	"quiubox/backend/internal/services"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type ScansHandler struct {
	service       *services.ScanService
	events        *services.ScanEventHub
	allowedOrigin string
}

func NewScansHandler(service *services.ScanService, events *services.ScanEventHub, allowedOrigin string) *ScansHandler {
	return &ScansHandler{service: service, events: events, allowedOrigin: allowedOrigin}
}

func (h *ScansHandler) List(w http.ResponseWriter, r *http.Request) {
	scans, err := h.service.List()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "no se pudo listar escaneos")
		return
	}
	writeJSON(w, http.StatusOK, scans)
}

func (h *ScansHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.StartScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "json inválido")
		return
	}
	scan, err := h.service.Start(req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, scan)
}

func (h *ScansHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := scanIDFromRequest(w, r, "id")
	if !ok {
		return
	}
	scan, err := h.service.Get(id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, scan)
}

func (h *ScansHandler) ListCompleted(w http.ResponseWriter, r *http.Request) {
	from, ok := parseDateQuery(w, r, "fromDate", false)
	if !ok {
		return
	}
	to, ok := parseDateQuery(w, r, "toDate", true)
	if !ok {
		return
	}
	scans, err := h.service.ListCompleted(r.URL.Query().Get("scanType"), from, to)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, scans)
}

func (h *ScansHandler) ListVulnerabilities(w http.ResponseWriter, r *http.Request) {
	scanID, ok := scanIDFromRequest(w, r, "scanId")
	if !ok {
		return
	}
	vulnerabilities, err := h.service.ListVulnerabilities(scanID)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, vulnerabilities)
}

func (h *ScansHandler) GetVulnerability(w http.ResponseWriter, r *http.Request) {
	scanID, ok := scanIDFromRequest(w, r, "scanId")
	if !ok {
		return
	}
	vulnID, ok := scanIDFromRequest(w, r, "vulnId")
	if !ok {
		return
	}
	vulnerability, err := h.service.GetVulnerability(scanID, vulnID)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, vulnerability)
}

func (h *ScansHandler) RefreshNVD(w http.ResponseWriter, r *http.Request) {
	h.GetVulnerability(w, r)
}

func (h *ScansHandler) WebSocket(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(req *http.Request) bool {
			origin := req.Header.Get("Origin")
			return origin == "" || h.allowedOrigin == "*" || origin == h.allowedOrigin
		},
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	events := h.events.Subscribe()
	defer h.events.Unsubscribe(events)

	for event := range events {
		if err := conn.WriteJSON(event); err != nil {
			return
		}
	}
}

func scanIDFromRequest(w http.ResponseWriter, r *http.Request, key string) (uint, bool) {
	raw := mux.Vars(r)[key]
	id, err := strconv.Atoi(raw)
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "id inválido")
		return 0, false
	}
	return uint(id), true
}

func parseDateQuery(w http.ResponseWriter, r *http.Request, key string, endOfDay bool) (*time.Time, bool) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return nil, true
	}
	parsed, err := time.Parse("2006-01-02", raw)
	if err != nil {
		writeError(w, http.StatusBadRequest, key+" inválida")
		return nil, false
	}
	if endOfDay {
		parsed = parsed.Add(24*time.Hour - time.Nanosecond)
	}
	return &parsed, true
}
