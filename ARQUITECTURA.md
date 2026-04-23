# Arquitectura de Quiubox

Este documento describe la arquitectura propuesta para Quiubox, sus componentes principales, responsabilidades y estrategia de despliegue con contenedores y Kubernetes.

## Vista general

Quiubox se plantea como una aplicacion web para ejecutar escaneos de red, analizar resultados y consultar vulnerabilidades detectadas.

La arquitectura separa responsabilidades en componentes independientes:

- Frontend Angular.
- Backend Go.
- Base de datos PostgreSQL.
- Motor OpenVAS en contenedor separado.
- Ejecucion de Nmap desde el backend o desde workers controlados.
- Comunicacion en tiempo real por WebSocket.
- Autenticacion por JWT.
- Despliegue mediante Docker y Kubernetes.

## Componentes

### Frontend

El frontend sera una aplicacion Angular. Sus responsabilidades son:

- Mostrar pantallas de login, dashboard, escaneos, resultados y administracion.
- Enviar peticiones HTTP REST al backend.
- Adjuntar JWT en peticiones protegidas.
- Mantener una conexion WebSocket para eventos de escaneo.
- Actualizar la interfaz cuando un escaneo finalice.

El frontend no se comunica directamente con OpenVAS, Nmap ni PostgreSQL.

### Backend

El backend sera una API en Go. Sus responsabilidades son:

- Exponer endpoints REST.
- Gestionar autenticacion y JWT.
- Validar entradas del usuario.
- Registrar escaneos.
- Ejecutar tareas asincronicas.
- Comunicarse con OpenVAS mediante GMP.
- Ejecutar comandos Nmap de forma controlada.
- Normalizar resultados.
- Guardar hallazgos en PostgreSQL.
- Emitir eventos WebSocket hacia el frontend.

El backend funciona como punto central de coordinacion entre la interfaz, la base de datos y los motores de escaneo.

### PostgreSQL

PostgreSQL sera la base de datos principal. Estara en su propio contenedor y almacenara:

- Usuarios.
- Sesiones o datos relacionados a autenticacion.
- Escaneos.
- Hosts detectados.
- Vulnerabilidades.
- Severidades.
- Recomendaciones.
- Parametros de configuracion.

PostgreSQL no sera expuesto publicamente. Solo el backend debe conectarse directamente.

### OpenVAS

OpenVAS estara en un contenedor separado. El backend se conectara a OpenVAS mediante GMP, Greenbone Management Protocol.

Responsabilidades de OpenVAS:

- Ejecutar analisis de vulnerabilidades.
- Gestionar targets y tasks.
- Producir reportes tecnicos.
- Devolver hallazgos para que el backend los procese.

OpenVAS no debe ser consumido directamente desde el frontend.

### Nmap

Nmap se utilizara para descubrimiento de red, puertos y servicios. Puede ejecutarse desde el backend o desde un worker especializado.

Responsabilidades de Nmap:

- Detectar hosts activos.
- Identificar puertos abiertos.
- Detectar servicios y versiones.
- Generar salida estructurada para posterior analisis.

El backend debe controlar estrictamente los parametros permitidos para evitar ejecuciones inseguras.

## Comunicacion entre componentes

```text
Frontend Angular
  | REST + JWT
  | WebSocket
  v
Backend Go
  | SQL
  v
PostgreSQL

Backend Go
  | GMP
  v
OpenVAS

Backend Go
  | comandos controlados
  v
Nmap
```

## Flujo de autenticacion

1. El usuario envia credenciales al backend.
2. El backend valida credenciales.
3. El backend emite un JWT.
4. El frontend conserva el token durante la sesion.
5. Cada peticion protegida incluye:

```http
Authorization: Bearer <jwt>
```

6. El backend valida el token antes de procesar la peticion.

En fases posteriores se agregaran permisos por rol para separar usuarios, analistas y administradores.

## Flujo de escaneo asincronico

1. El usuario crea un escaneo desde Angular.
2. Angular envia `POST /api/scans`.
3. El backend valida el JWT y la entrada.
4. El backend crea el registro en PostgreSQL.
5. El backend agenda la ejecucion asincronica.
6. El backend responde inmediatamente al frontend.
7. El job de escaneo ejecuta Nmap, OpenVAS o ambos.
8. El backend transforma los resultados al modelo interno.
9. PostgreSQL almacena los resultados.
10. El backend emite evento WebSocket.
11. El frontend refresca las pantallas necesarias.

Este enfoque evita que una peticion HTTP quede abierta durante todo el escaneo.

## Contenedores Docker

La estrategia de contenedores contempla:

- `frontend`: Angular compilado y servido por un servidor web.
- `backend`: API Go.
- `postgres`: base de datos PostgreSQL.
- `openvas`: motor de escaneo OpenVAS.

Ejemplo conceptual:

```text
quiubox-frontend
quiubox-backend
quiubox-postgres
quiubox-openvas
```

Cada contenedor debe tener variables de entorno propias y configuracion separada.

## Kubernetes

Kubernetes se utilizara para orquestar los contenedores. La propuesta base incluye:

- Deployment para frontend.
- Deployment para backend.
- StatefulSet para PostgreSQL.
- Deployment o StatefulSet para OpenVAS, segun persistencia requerida.
- Services internos para comunicacion entre pods.
- Ingress para exponer frontend y API.
- ConfigMaps para configuracion no sensible.
- Secrets para credenciales, JWT secrets y passwords.
- PersistentVolumes para PostgreSQL y datos necesarios de OpenVAS.

## Servicios internos recomendados

```text
frontend-service
backend-service
postgres-service
openvas-service
```

El frontend consumira el backend mediante una URL publica o ruta de Ingress. El backend consumira PostgreSQL y OpenVAS usando servicios internos del cluster.

## Seguridad

Controles recomendados:

- JWT para proteger peticiones REST.
- Validacion de entrada en todos los endpoints.
- Parametros permitidos para Nmap.
- OpenVAS sin exposicion publica.
- PostgreSQL accesible solo desde backend.
- Secrets de Kubernetes para credenciales.
- TLS en Ingress.
- Logs sin tokens ni passwords.
- Timeouts para escaneos y comandos externos.

## Escalabilidad

La arquitectura debe permitir evolucionar hacia workers de escaneo separados.

MVP:

```text
Backend API + ejecucion asincronica interna
```

Evolucion:

```text
Backend API
  -> cola de trabajos
  -> workers de escaneo
  -> OpenVAS/Nmap
```

Esto permitiria escalar workers sin escalar necesariamente la API.

## Persistencia

PostgreSQL sera persistente mediante volumen. OpenVAS tambien puede requerir persistencia para configuracion, feeds y reportes temporales.

Datos persistentes principales:

- Base de datos de Quiubox.
- Feeds y configuracion de OpenVAS.
- Logs operativos si se decide conservarlos.

## Resumen arquitectonico

Quiubox seguira una arquitectura web distribuida:

- Angular para la experiencia de usuario.
- Go como API y coordinador de escaneos.
- PostgreSQL como almacenamiento central.
- OpenVAS como motor de vulnerabilidades en contenedor separado.
- Nmap como herramienta de descubrimiento y puertos.
- WebSocket para eventos en tiempo real.
- JWT para seguridad de peticiones.
- Docker y Kubernetes para despliegue y escalabilidad.

