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
	Usuario         Usuario    `gorm:"foreignKey:IDUsuario;references:IDUsuario" json:"usuario"`
	TokenHash       string     `gorm:"column:token_hash;size:255;not null" json:"-"`
	IP              *string    `gorm:"column:ip;type:inet" json:"ip"`
	UserAgent       *string    `gorm:"column:user_agent;size:255" json:"user_agent"`
	FechaInicio     time.Time  `gorm:"column:fecha_inicio;autoCreateTime" json:"fecha_inicio"`
	FechaExpiracion time.Time  `gorm:"column:fecha_expiracion;not null" json:"fecha_expiracion"`
	FechaCierre     *time.Time `gorm:"column:fecha_cierre" json:"fecha_cierre"`
	Activa          bool       `gorm:"column:activa;not null;default:true" json:"activa"`
}

func (Sesion) TableName() string { return "sesion" }

type EstadoEscaneo struct {
	IDEstadoEscaneo uint   `gorm:"column:id_estado_escaneo;primaryKey;autoIncrement" json:"id_estado_escaneo"`
	Nombre          string `gorm:"column:nombre;size:50;not null;unique" json:"nombre"`
	Descripcion     string `gorm:"column:descripcion;size:255" json:"descripcion"`
}

func (EstadoEscaneo) TableName() string { return "estado_escaneo" }

type Escaneo struct {
	IDEscaneo       uint          `gorm:"column:id_escaneo;primaryKey;autoIncrement" json:"id_escaneo"`
	IDUsuario       uint          `gorm:"column:id_usuario;not null;index" json:"id_usuario"`
	Usuario         Usuario       `gorm:"foreignKey:IDUsuario;references:IDUsuario" json:"usuario"`
	IDEstadoEscaneo uint          `gorm:"column:id_estado_escaneo;not null;index" json:"id_estado_escaneo"`
	EstadoEscaneo   EstadoEscaneo `gorm:"foreignKey:IDEstadoEscaneo;references:IDEstadoEscaneo" json:"estado_escaneo"`
	Objetivo        string        `gorm:"column:objetivo;size:255;not null" json:"objetivo"`
	TipoEscaneo     string        `gorm:"column:tipo_escaneo;size:50;not null" json:"tipo_escaneo"`
	Herramienta     string        `gorm:"column:herramienta;size:50;not null" json:"herramienta"`
	FechaInicio     time.Time     `gorm:"column:fecha_inicio;autoCreateTime" json:"fecha_inicio"`
	FechaFin        *time.Time    `gorm:"column:fecha_fin" json:"fecha_fin"`
	Observaciones   *string       `gorm:"column:observaciones;type:text" json:"observaciones"`
}

func (Escaneo) TableName() string { return "escaneo" }

type Host struct {
	IDHost           uint    `gorm:"column:id_host;primaryKey;autoIncrement" json:"id_host"`
	IDEscaneo        uint    `gorm:"column:id_escaneo;not null;index" json:"id_escaneo"`
	Escaneo          Escaneo `gorm:"foreignKey:IDEscaneo;references:IDEscaneo" json:"escaneo"`
	IP               string  `gorm:"column:ip;type:inet;not null" json:"ip"`
	Hostname         *string `gorm:"column:hostname;size:255" json:"hostname"`
	SistemaOperativo *string `gorm:"column:sistema_operativo;size:255" json:"sistema_operativo"`
	EstadoHost       *string `gorm:"column:estado_host;size:50" json:"estado_host"`
}

func (Host) TableName() string { return "host" }

type Severidad struct {
	IDSeveridad uint    `gorm:"column:id_severidad;primaryKey;autoIncrement" json:"id_severidad"`
	Nombre      string  `gorm:"column:nombre;size:50;not null;unique" json:"nombre"`
	Descripcion string  `gorm:"column:descripcion;size:255" json:"descripcion"`
	PuntajeMin  float64 `gorm:"column:puntaje_min;type:numeric(4,1);not null" json:"puntaje_min"`
	PuntajeMax  float64 `gorm:"column:puntaje_max;type:numeric(4,1);not null" json:"puntaje_max"`
}

func (Severidad) TableName() string { return "severidad" }

type Recomendacion struct {
	IDRecomendacion uint      `gorm:"column:id_recomendacion;primaryKey;autoIncrement" json:"id_recomendacion"`
	Titulo          string    `gorm:"column:titulo;size:150;not null" json:"titulo"`
	Descripcion     string    `gorm:"column:descripcion;type:text;not null" json:"descripcion"`
	Fuente          *string   `gorm:"column:fuente;size:255" json:"fuente"`
	FechaCreacion   time.Time `gorm:"column:fecha_creacion;autoCreateTime" json:"fecha_creacion"`
}

func (Recomendacion) TableName() string { return "recomendacion" }

type DetalleEscaneo struct {
	IDDetalle            uint           `gorm:"column:id_detalle;primaryKey;autoIncrement" json:"id_detalle"`
	IDEscaneo            uint           `gorm:"column:id_escaneo;not null;index" json:"id_escaneo"`
	Escaneo              Escaneo        `gorm:"foreignKey:IDEscaneo;references:IDEscaneo" json:"escaneo"`
	IDHost               uint           `gorm:"column:id_host;not null;index" json:"id_host"`
	Host                 Host           `gorm:"foreignKey:IDHost;references:IDHost" json:"host"`
	IDSeveridad          uint           `gorm:"column:id_severidad;not null;index" json:"id_severidad"`
	Severidad            Severidad      `gorm:"foreignKey:IDSeveridad;references:IDSeveridad" json:"severidad"`
	IDRecomendacion      *uint          `gorm:"column:id_recomendacion;index" json:"id_recomendacion"`
	Recomendacion        *Recomendacion `gorm:"foreignKey:IDRecomendacion;references:IDRecomendacion" json:"recomendacion"`
	NombreVulnerabilidad string         `gorm:"column:nombre_vulnerabilidad;size:255;not null" json:"nombre_vulnerabilidad"`
	Descripcion          *string        `gorm:"column:descripcion;type:text" json:"descripcion"`
	Puerto               *int           `gorm:"column:puerto" json:"puerto"`
	Protocolo            *string        `gorm:"column:protocolo;size:20" json:"protocolo"`
	CVE                  *string        `gorm:"column:cve;size:50" json:"cve"`
	CVSS                 *float64       `gorm:"column:cvss;type:numeric(4,1)" json:"cvss"`
	QOD                  *float64       `gorm:"column:qod;type:numeric(5,2)" json:"qod"`
	Solucion             *string        `gorm:"column:solucion;type:text" json:"solucion"`
	FechaDetectada       time.Time      `gorm:"column:fecha_detectada;autoCreateTime" json:"fecha_detectada"`
}

func (DetalleEscaneo) TableName() string { return "detalle_escaneo" }

type Parametro struct {
	IDParametro uint    `gorm:"column:id_parametro;primaryKey;autoIncrement" json:"id_parametro"`
	Clave       string  `gorm:"column:clave;size:100;not null;unique" json:"clave"`
	Valor       string  `gorm:"column:valor;type:text;not null" json:"valor"`
	Descripcion *string `gorm:"column:descripcion;size:255" json:"descripcion"`
	Editable    bool    `gorm:"column:editable;not null;default:true" json:"editable"`
}

func (Parametro) TableName() string { return "parametros" }
