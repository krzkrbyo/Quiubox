# Estrategia de escaneos

Este documento describe el flujo esperado para ejecutar escaneos en Quiubox, la forma de comunicacion entre frontend y backend, y la integracion futura con OpenVAS y Nmap.

## Objetivo

La estrategia es que los escaneos se ejecuten de forma asincronica. El usuario podra iniciar un escaneo desde la interfaz y continuar usando el sistema mientras el backend procesa la tarea. Cuando el escaneo finalice, el backend notificara al frontend por WebSocket y los resultados quedaran guardados en la base de datos para consulta posterior.

## Flujo general

1. El usuario inicia sesion en el frontend.
2. El frontend obtiene un token JWT desde el backend.
3. El usuario crea un nuevo escaneo desde la pantalla de Escaneos.
4. El frontend envia una peticion HTTP `POST /api/scans` al backend, incluyendo el JWT en el encabezado `Authorization`.
5. El backend valida la peticion, registra el escaneo en la base de datos y lo marca como `Ejecutando`.
6. El backend devuelve una respuesta inmediata al frontend para no bloquear la interfaz.
7. El frontend abre o mantiene una conexion WebSocket con el backend para escuchar eventos del escaneo.
8. El backend ejecuta el escaneo de manera asincronica:
   - Si el tipo es Nmap, ejecuta comandos controlados de Nmap.
   - Si el tipo es OpenVAS, se comunica con OpenVAS mediante el protocolo GMP.
   - Si el tipo es combinado, coordina ambos motores.
9. El backend procesa la salida de las herramientas y normaliza los hallazgos.
10. El backend almacena hosts, vulnerabilidades, severidades y recomendaciones en PostgreSQL.
11. Al finalizar, el backend marca el escaneo como `Finalizado` o `Error`.
12. El backend emite un evento WebSocket `scan.finished`.
13. El frontend recibe el evento, muestra una notificacion y refresca las tablas de Escaneos y Resultados.

## Comunicacion frontend-backend

La comunicacion principal sera HTTP REST para operaciones de negocio y WebSocket para eventos en tiempo real.

### REST

REST se utilizara para:

- Crear escaneos.
- Listar escaneos.
- Consultar detalle de un escaneo.
- Consultar vulnerabilidades detectadas.
- Consultar reportes y resultados historicos.
- Administrar usuarios y sesiones.

Ejemplo de peticion:

```http
POST /api/scans
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "target": "192.168.1.0/24",
  "scanType": "combined"
}
```

### WebSocket

WebSocket se utilizara para notificar eventos asincronicos sin que el frontend tenga que consultar repetidamente.

Evento esperado al finalizar:

```json
{
  "type": "scan.finished",
  "scanId": "15",
  "status": "completed",
  "criticalCount": 1,
  "mediumCount": 3,
  "lowCount": 2
}
```

Eventos recomendados para evolucion futura:

- `scan.started`
- `scan.progress`
- `scan.finished`
- `scan.failed`
- `scan.cancelled`

## Seguridad con JWT

Las peticiones REST protegidas usaran JWT. El frontend almacenara el token de sesion y lo enviara en cada peticion al backend.

Responsabilidades del JWT:

- Identificar al usuario que ejecuta el escaneo.
- Asociar cada escaneo con su usuario.
- Proteger endpoints administrativos.
- Permitir validaciones de rol en fases posteriores.

La conexion WebSocket tambien deberia autenticarse. La estrategia recomendada es enviar el JWT al iniciar la conexion, por ejemplo mediante query string temporal o protocolo de autenticacion en el primer mensaje. En produccion debe evitarse exponer tokens en logs.

## Ejecucion asincronica

Los escaneos no deben ejecutarse dentro del ciclo directo de la peticion HTTP. La peticion solo debe registrar la tarea y devolver una respuesta rapida.

La ejecucion asincronica permite:

- No bloquear la interfaz.
- Ejecutar multiples escaneos en paralelo.
- Permitir que el usuario navegue por el sistema mientras el analisis continua.
- Reintentar o marcar fallos sin perder trazabilidad.
- Escalar workers de escaneo de forma independiente.

Estados base del escaneo:

- `Pendiente`: tarea registrada, aun no ejecutada.
- `Ejecutando`: tarea en proceso.
- `Finalizado`: tarea completada correctamente.
- `Error`: tarea fallo.
- `Cancelado`: tarea detenida por usuario o sistema.

## Integracion con Nmap

Nmap se usara para descubrimiento de hosts, deteccion de puertos y servicios.

El backend debe ejecutar comandos de forma controlada:

- Validar objetivo antes de ejecutar.
- No concatenar parametros sin validacion.
- Usar listas permitidas de opciones.
- Definir timeouts.
- Capturar salida estructurada cuando sea posible, preferiblemente XML.
- Registrar errores de ejecucion sin exponer detalles sensibles al frontend.

Ejemplo conceptual:

```bash
nmap -sV -oX - 192.168.1.0/24
```

El backend parseara el resultado y lo guardara en tablas como `host` y `detalle_escaneo`.

## Integracion con OpenVAS

OpenVAS estara desplegado en un contenedor separado. El backend se comunicara con OpenVAS mediante GMP, Greenbone Management Protocol.

Flujo recomendado:

1. El backend recibe la solicitud de escaneo.
2. El backend crea o reutiliza un target en OpenVAS.
3. El backend crea una task de escaneo mediante GMP.
4. El backend inicia la task.
5. El backend consulta periodicamente el estado o recibe informacion de progreso.
6. Al finalizar, el backend obtiene el reporte.
7. El backend transforma los hallazgos al modelo interno de Quiubox.
8. El backend guarda los resultados en PostgreSQL.
9. El backend notifica al frontend por WebSocket.

OpenVAS no debe ser expuesto directamente al navegador. Toda comunicacion con OpenVAS debe pasar por el backend.

## Persistencia de resultados

Los resultados se guardaran en PostgreSQL. Aunque en la interfaz se hable de "Resultados", a nivel de base de datos los datos se distribuyen en tablas del dominio:

- `escaneo`: informacion general del escaneo.
- `host`: hosts detectados.
- `detalle_escaneo`: vulnerabilidades o hallazgos.
- `severidad`: clasificacion del riesgo.
- `recomendacion`: acciones sugeridas.

Esto permite consultar historicos, generar reportes y filtrar por severidad, fecha, tipo de escaneo o usuario.

## Manejo de multiples escaneos

La plataforma debe permitir multiples escaneos asincronicos. La estrategia recomendada es manejar una cola interna o un sistema de jobs.

Para el MVP puede usarse una ejecucion asincronica simple dentro del backend. Para una version mas robusta se recomienda:

- Cola de trabajos.
- Workers independientes.
- Limites de concurrencia.
- Reintentos controlados.
- Cancelacion de tareas.
- Observabilidad por job.

## Resumen del flujo

```text
Usuario
  -> Frontend Angular
  -> REST POST /api/scans con JWT
  -> Backend Go
  -> Registra escaneo en PostgreSQL
  -> Ejecuta job asincronico
  -> Nmap y/o OpenVAS por GMP
  -> Procesa resultados
  -> Guarda hallazgos en PostgreSQL
  -> Emite evento WebSocket
  -> Frontend refresca Resultados
```

