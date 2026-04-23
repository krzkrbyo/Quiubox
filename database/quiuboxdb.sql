BEGIN;

CREATE TABLE rol (
    id_rol SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255)
);

CREATE TABLE usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    id_rol SMALLINT NOT NULL REFERENCES rol(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT,
    username VARCHAR(50) NOT NULL,
    nombres VARCHAR(50) NOT NULL,
    apellidos VARCHAR(50) NOT NULL,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultimo_acceso TIMESTAMPTZ
);

CREATE TABLE sesion (
    id_sesion BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip INET,
    user_agent VARCHAR(255),
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    fecha_cierre TIMESTAMPTZ,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_sesion_fechas CHECK (fecha_expiracion > fecha_inicio)
);

CREATE TABLE estado_escaneo (
    id_estado_escaneo SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255)
);

CREATE TABLE escaneo (
    id_escaneo BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_estado_escaneo SMALLINT NOT NULL REFERENCES estado_escaneo(id_estado_escaneo) ON UPDATE CASCADE ON DELETE RESTRICT,
    objetivo VARCHAR(255) NOT NULL,
    tipo_escaneo VARCHAR(50) NOT NULL,
    herramienta VARCHAR(50) NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    observaciones TEXT
);

CREATE TABLE host (
    id_host BIGSERIAL PRIMARY KEY,
    id_escaneo BIGINT NOT NULL REFERENCES escaneo(id_escaneo) ON UPDATE CASCADE ON DELETE CASCADE,
    ip INET NOT NULL,
    hostname VARCHAR(255),
    sistema_operativo VARCHAR(255),
    estado_host VARCHAR(50)
);

CREATE TABLE severidad (
    id_severidad SMALLSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    puntaje_min NUMERIC(4,1) NOT NULL,
    puntaje_max NUMERIC(4,1) NOT NULL,
    CONSTRAINT chk_severidad_rango CHECK (puntaje_min >= 0 AND puntaje_max <= 10 AND puntaje_min <= puntaje_max)
);

CREATE TABLE recomendacion (
    id_recomendacion BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    fuente VARCHAR(255),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE detalle_escaneo (
    id_detalle BIGSERIAL PRIMARY KEY,
    id_escaneo BIGINT NOT NULL REFERENCES escaneo(id_escaneo) ON UPDATE CASCADE ON DELETE CASCADE,
    id_host BIGINT NOT NULL REFERENCES host(id_host) ON UPDATE CASCADE ON DELETE CASCADE,
    id_severidad SMALLINT NOT NULL REFERENCES severidad(id_severidad) ON UPDATE CASCADE ON DELETE RESTRICT,
    id_recomendacion BIGINT REFERENCES recomendacion(id_recomendacion) ON UPDATE CASCADE ON DELETE SET NULL,
    nombre_vulnerabilidad VARCHAR(255) NOT NULL,
    descripcion TEXT,
    puerto INTEGER,
    protocolo VARCHAR(20),
    cve VARCHAR(50),
    cvss NUMERIC(4,1),
    qod NUMERIC(5,2),
    solucion TEXT,
    fecha_detectada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_detalle_puerto CHECK (puerto IS NULL OR (puerto BETWEEN 1 AND 65535)),
    CONSTRAINT chk_detalle_cvss CHECK (cvss IS NULL OR (cvss >= 0 AND cvss <= 10)),
    CONSTRAINT chk_detalle_qod CHECK (qod IS NULL OR (qod >= 0 AND qod <= 100))
);

CREATE TABLE parametros (
    id_parametro BIGSERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    descripcion VARCHAR(255),
    editable BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX ux_rol_nombre ON rol (nombre);
CREATE UNIQUE INDEX ux_usuario_username ON usuario (username);
CREATE UNIQUE INDEX ux_usuario_email ON usuario (email);
CREATE UNIQUE INDEX ux_estado_escaneo_nombre ON estado_escaneo (nombre);
CREATE UNIQUE INDEX ux_severidad_nombre ON severidad (nombre);
CREATE UNIQUE INDEX ux_parametros_clave ON parametros (clave);
CREATE INDEX ix_usuario_id_rol ON usuario (id_rol);
CREATE INDEX ix_sesion_id_usuario ON sesion (id_usuario);
CREATE INDEX ix_escaneo_id_usuario ON escaneo (id_usuario);
CREATE INDEX ix_escaneo_id_estado_escaneo ON escaneo (id_estado_escaneo);
CREATE INDEX ix_host_id_escaneo ON host (id_escaneo);
CREATE INDEX ix_detalle_id_escaneo ON detalle_escaneo (id_escaneo);
CREATE INDEX ix_detalle_id_host ON detalle_escaneo (id_host);
CREATE INDEX ix_detalle_id_severidad ON detalle_escaneo (id_severidad);
CREATE INDEX ix_detalle_id_recomendacion ON detalle_escaneo (id_recomendacion);

INSERT INTO rol (nombre, descripcion) VALUES
    ('Administrador', 'Acceso total al sistema'),
    ('Analista', 'Gestiona y revisa escaneos'),
    ('Usuario', 'Usuario estándar del sistema');

INSERT INTO estado_escaneo (nombre, descripcion) VALUES
    ('Pendiente', 'Escaneo programado y aún no iniciado'),
    ('Ejecutando', 'Escaneo en proceso'),
    ('Finalizado', 'Escaneo completado correctamente'),
    ('Error', 'Escaneo finalizado con error'),
    ('Cancelado', 'Escaneo cancelado por el usuario o el sistema');

INSERT INTO severidad (nombre, descripcion, puntaje_min, puntaje_max) VALUES
    ('Crítica', 'Vulnerabilidad con impacto severo', 9.0, 10.0),
    ('Alta', 'Vulnerabilidad de alto riesgo', 7.0, 8.9),
    ('Media', 'Vulnerabilidad de riesgo moderado', 4.0, 6.9),
    ('Baja', 'Vulnerabilidad de bajo riesgo', 0.1, 3.9),
    ('Informativa', 'Hallazgo sin impacto de seguridad directo', 0.0, 0.0);

COMMIT;
