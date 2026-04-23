package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"quiubox/backend/internal/dto"
	"quiubox/backend/internal/services"

	"github.com/gorilla/mux"
)

type UsersHandler struct {
	service *services.UserService
}

func NewUsersHandler(service *services.UserService) *UsersHandler {
	return &UsersHandler{service: service}
}

func (h *UsersHandler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.service.List()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "no se pudo listar usuarios")
		return
	}
	writeJSON(w, http.StatusOK, users)
}

func (h *UsersHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "json inválido")
		return
	}
	user, err := h.service.Create(req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, user)
}

func (h *UsersHandler) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "id inválido")
		return
	}
	var req dto.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "json inválido")
		return
	}
	user, err := h.service.Update(uint(id), req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h *UsersHandler) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "id inválido")
		return
	}
	if err := h.service.Delete(uint(id)); err != nil {
		writeError(w, http.StatusBadRequest, "no se pudo eliminar usuario")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
