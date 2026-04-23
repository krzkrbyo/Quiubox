package models

import "time"

type Rol struct {
	IDRol       uint   `gorm:"column:id_rol;primaryKey;autoIncrement" json:"id_rol"`
	Nombre      string `gorm:"column:nombre;size:50;not null;unique" json:"nombre"`
	Descripcion string `gorm:"column:descripcion;size:255" json:"descripcion"`
}

func (Rol) TableName() string { return "rol" }

type Usuario struct {
	IDUsuario     uint       `gorm:"column:id_usuario;primaryKey;autoIncrement" json:"id_usuario"`
	IDRol         uint       `gorm:"column:id_rol;not null;index" json:"id_rol"`
	Rol           Rol        `gorm:"foreignKey:IDRol;references:IDRol" json:"rol"`
	Username      string     `gorm:"column:username;size:50;not null;unique" json:"username"`
	Nombres       string     `gorm:"column:nombres;size:50;not null" json:"nombres"`
	Apellidos     string     `gorm:"column:apellidos;size:50;not null" json:"apellidos"`
	Email         string     `gorm:"column:email;size:120;not null;unique" json:"email"`
	PasswordHash  string     `gorm:"column:password_hash;size:255;not null" json:"-"`
	Activo        bool       `gorm:"column:activo;not null;default:true" json:"activo"`
	FechaCreacion time.Time  `gorm:"column:fecha_creacion;autoCreateTime" json:"fecha_creacion"`
	UltimoAcceso  *time.Time `gorm:"column:ultimo_acceso" json:"ultimo_acceso"`
}

func (Usuario) TableName() string { return "usuario" }

type Sesion struct {
	IDSesion        uint       `gorm:"column:id_sesion;primaryKey;autoIncrement" json:"id_sesion"`
	IDUsuario       uint       `gorm:"column:id_usuario;not null;index" json:"id_usuario"`
	TokenHash       string     `gorm:"column:token_hash;size:255;not null" json:"-"`
	IP              *string    `gorm:"column:ip;type:inet" json:"ip"`
	UserAgent       *string    `gorm:"column:user_agent;size:255" json:"user_agent"`
	FechaInicio     time.Time  `gorm:"column:fecha_inicio;autoCreateTime" json:"fecha_inicio"`
	FechaExpiracion time.Time  `gorm:"column:fecha_expiracion;not null" json:"fecha_expiracion"`
	FechaCierre     *time.Time `gorm:"column:fecha_cierre" json:"fecha_cierre"`
	Activa          bool       `gorm:"column:activa;not null;default:true" json:"activa"`
}

func (Sesion) TableName() string { return "sesion" }
