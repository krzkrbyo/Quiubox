# Documento de Requerimientos

## 1. Introducción

### Objetivo del sistema
Desarrollar una plataforma de gestión de vulnerabilidades que permita identificar, analizar y gestionar vulnerabilidades en redes empresariales y servidores, facilitando la toma de decisiones en materia de seguridad.

### Alcance
El sistema estará enfocado en un entorno académico (MVP), permitiendo:
- Escaneo automático de redes
- Identificación de vulnerabilidades
- Visualización de resultados
- Generación de recomendaciones básicas de mitigación

No se contemplan integraciones avanzadas ni automatización completa de respuesta ante incidentes.

---

## 2. Descripción General

### Visión del sistema
La plataforma será una aplicación web que permitirá a los usuarios ejecutar escaneos de red, visualizar vulnerabilidades detectadas y obtener recomendaciones básicas de mitigación, todo desde una interfaz centralizada.

### Tecnologías utilizadas
- Backend: Go
- Frontend: Angular
- Herramientas de escaneo: Nmap, OpenVAS
- Base de datos: PostgreSQL
- Infraestructura: Kubernetes

---

## 3. Actores del Sistema

- **Usuario**: Persona que ejecuta escaneos y consulta resultados.
- **Administrador**: Usuario con permisos para configurar el sistema y gestionar usuarios.
- **Sistema de Escaneo**: Integración con herramientas externas (Nmap y OpenVAS).

---

## 4. Casos de Uso

### CU-01: Ejecutar escaneo de red
- **Descripción**: El usuario inicia un escaneo sobre una red o servidor específico.
- **Actores**: Usuario
- **Flujo básico**:
  1. El usuario ingresa la dirección IP o rango de red.
  2. Selecciona el tipo de escaneo.
  3. El sistema ejecuta Nmap/OpenVAS.
  4. Se almacenan los resultados.

---

### CU-02: Programar escaneo automático
- **Descripción**: Permite programar escaneos en fechas específicas.
- **Actores**: Usuario
- **Flujo básico**:
  1. El usuario configura fecha y frecuencia.
  2. El sistema agenda el escaneo.
  3. El sistema ejecuta el escaneo automáticamente.

---

### CU-03: Visualizar vulnerabilidades
- **Descripción**: El usuario consulta los resultados de los escaneos.
- **Actores**: Usuario
- **Flujo básico**:
  1. El usuario accede al panel de resultados.
  2. Selecciona un escaneo.
  3. Visualiza vulnerabilidades detectadas.

---

### CU-04: Obtener recomendaciones de mitigación
- **Descripción**: El sistema muestra sugerencias básicas para corregir vulnerabilidades.
- **Actores**: Usuario
- **Flujo básico**:
  1. El usuario selecciona una vulnerabilidad.
  2. El sistema muestra recomendaciones asociadas.

---

### CU-05: Gestión de usuarios
- **Descripción**: El administrador gestiona accesos al sistema.
- **Actores**: Administrador
- **Flujo básico**:
  1. El administrador crea o elimina usuarios.
  2. Asigna roles.
  3. Guarda cambios.

---

### CU-06: Exportación de reportes PDF
- **Descripción**: El usuario puede sacar reportes sobre escaneos hechos con anterioridad o vulnerabilidades detectadas, comparaciones entre diferentes escaneos, etc.
- **Actores**: Usuarios

## 5. Requerimientos Funcionales

### Módulo de Escaneo
- **RF-01**: El sistema debe permitir ejecutar escaneos manuales de red.
- **RF-02**: El sistema debe integrarse con Nmap para escaneo de puertos.
- **RF-03**: El sistema debe integrarse con OpenVAS para detección de vulnerabilidades.
- **RF-04**: ¿? El sistema debe permitir programar escaneos automáticos.

### Módulo de Resultados

- **RF-15**: El sistema debe notificar cuando un escaneo ha sido finalizado o si se detectaron vulnerabilidades criticas.
- **RF-05**: El sistema debe almacenar los resultados de los escaneos en la base de datos.
- **RF-06**: El sistema debe mostrar vulnerabilidades clasificadas por nivel de riesgo.
- **RF-07**: El sistema debe permitir filtrar resultados por fecha o tipo.
**RF-14**: El sistema debe permitir Exportar resultados de escaneo PDF.

### Módulo de Mitigación
- **RF-08**: El sistema debe mostrar recomendaciones básicas de mitigación.
- **RF-09**: El sistema debe asociar vulnerabilidades con posibles soluciones.
**RF-16**: Consumir la API De NVD para obtener más detalles de la vulnerabilidad.

### Módulo de Usuarios
- **RF-10**: El sistema debe permitir autenticación de usuarios.
- **RF-11**: El sistema debe manejar roles (usuario, administrador).
- **RF-12**: El administrador debe poder gestionar usuarios.

### Panel de resumen
- **RF-13**: El sistema debe de contar con dashboard:
- - El total de vulnerabilidades 
- - (criticas/medias/bajas)
- - Ultimo Escaneo
- - etc





## 6. Requerimientos No Funcionales

### Rendimiento
- El sistema debe procesar escaneos sin bloquear la interfaz.
- Los resultados deben mostrarse en menos de 5 segundos después de consultarlos.

### Seguridad
- Autenticación mediante usuario y contraseña.
- Protección básica contra accesos no autorizados.
- (x) Uso de HTTPS.

### Escalabilidad
- El sistema debe poder desplegarse en contenedores usando Kubernetes.
- Debe soportar múltiples escaneos concurrentes (nivel básico).

### Usabilidad
- Interfaz intuitiva y sencilla, tema oscuro verdoso (hacker)
- Navegación clara entre módulos.
- Visualización amigable de resultados.

---

## 7. Arquitectura General (Alto Nivel)

La arquitectura del sistema estará basada en un modelo cliente-servidor:

- **Frontend (Angular)**:
  - Interfaz de usuario
  - Visualización de datos
  - Interacción con API

- **Backend (Go)**:
  - API REST
  - Lógica de negocio
  - Integración con herramientas de escaneo

- **Herramientas externas**:
  - Nmap: escaneo de red
  - OpenVAS: análisis de vulnerabilidades

- **Base de datos (PostgreSQL)**:
  - Almacenamiento de resultados
  - Gestión de usuarios

- **Infraestructura (Kubernetes)**:
  - Despliegue de servicios
  - Escalabilidad básica

---

## 8. Supuestos y Limitaciones

### Supuestos
- Los usuarios tienen conocimientos básicos de redes.
- Las herramientas Nmap y OpenVAS están correctamente configuradas.
- El entorno de ejecución permite el escaneo de redes.

### Limitaciones
- No se implementarán respuestas automáticas a vulnerabilidades.
- No se incluye análisis avanzado de amenazas.
- El sistema estará limitado a un entorno controlado (académico).
- No se garantiza escalabilidad a nivel empresarial.

---

## 9. Conclusión

Este documento define los requerimientos para una plataforma de gestión de vulnerabilidades enfocada en un MVP académico. El sistema permitirá realizar escaneos de red, identificar vulnerabilidades y ofrecer recomendaciones básicas, utilizando tecnologías modernas y una arquitectura simple pero funcional.

El enfoque principal es lograr una solución clara, entendible y viable para un primer proyecto, priorizando funcionalidad sobre complejidad.