package dto

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type UserResponse struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Nombres   string `json:"nombres,omitempty"`
	Apellidos string `json:"apellidos,omitempty"`
	Email     string `json:"email"`
	Role      string `json:"role"`
}

type LoginResponse struct {
	AccessToken string       `json:"accessToken"`
	User        UserResponse `json:"user"`
}

type RegisterRequest struct {
	Username  string `json:"username"`
	Nombres   string `json:"nombres"`
	Apellidos string `json:"apellidos"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	IDRol     uint   `json:"id_rol"`
}

type AuthResponse struct {
	Message string `json:"message"`
}

type CreateUserRequest struct {
	Username  string `json:"username"`
	Nombres   string `json:"nombres"`
	Apellidos string `json:"apellidos"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Role      string `json:"role"`
}

type UpdateUserRequest struct {
	Nombres   string `json:"nombres"`
	Apellidos string `json:"apellidos"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Activo    *bool  `json:"activo,omitempty"`
}
