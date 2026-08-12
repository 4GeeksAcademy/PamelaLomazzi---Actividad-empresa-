# Propuesta de Arquitectura de Backend - HealthCore
## 1. Introducción y Contexto de Negocio

HealthCore opera una plataforma de servicios de salud con presencia multisede y alta sensibilidad regulatoria. El estado actual combina sistemas clínicos fragmentados por sede, procesos de admisión manuales, baja confianza digital por debilidades en seguridad perimetral (incluyendo ausencia histórica de SSL), errores recurrentes en facturación y baja visibilidad ejecutiva de datos consolidados.

Para sostener la operación y habilitar crecimiento, el backend debe convertirse en una capa de negocio unificada que normalice procesos, centralice reglas y exponga capacidades consistentes al frontend y a integraciones internas/externas.

Departamentos clave considerados en la propuesta:

1. Admisiones y Registro de Pacientes.
2. Programación de Citas.
3. Operaciones Clínicas (historia clínica y seguimiento asistencial).
4. Facturación y Cobros.
5. Atención al Paciente y Contact Center.
6. Cumplimiento, Seguridad y Auditoría.
7. Analítica Ejecutiva y Reportes de Gestión.

La modernización del backend con Python y FastAPI se justifica por velocidad de entrega, robustez para APIs de misión crítica, ecosistema maduro para validación/seguridad y facilidad de integración con el Asistente Virtual de Admisión bilingüe bajo marcos HIPAA y UK GDPR.

## 2. Selección del Patrón Arquitectónico y Justificación

Se propone una Arquitectura Hexagonal implementada como Monolito Modular en fase inicial.

Decisión: priorizar una única unidad de despliegue (monolito) para reducir complejidad operativa temprana, pero con límites de dominio estrictos (hexagonal) para evitar acoplamiento y facilitar evolución futura a servicios independientes cuando el volumen o criticidad lo exija.

Por qué encaja con HealthCore:

1. Aislamiento de datos de pacientes.
Cada dominio (admisiones, citas, facturación, agente IA) expone puertos de aplicación y consume repositorios por interfaces. Esto evita que controladores o integraciones externas accedan de forma directa a entidades clínicas sensibles.

2. Integración controlada del Agente de IA.
El agente se trata como un adaptador externo, no como núcleo de negocio. Sus solicitudes entran por puertos definidos con políticas de autorización, redacción de PII y trazabilidad. Así se limita el riesgo de que la lógica conversacional contamine reglas clínicas o financieras.

3. Operación multisede consistente.
Las reglas transversales (tenant/site context, permisos, auditoría, encriptación, retención) se centralizan en capa de aplicación e infraestructura compartida, evitando divergencias por sede.

4. Cumplimiento HIPAA y UK GDPR por diseño.
La separación entre dominio, casos de uso y adaptadores permite imponer controles uniformes: mínimo privilegio, registro de accesos a PHI, consentimiento, derecho de rectificación y políticas de retención/borrado.

5. Evolución sin reescritura.
Si un módulo crece (por ejemplo facturación o agente IA), puede extraerse a microservicio sin romper contratos internos, porque ya opera con puertos y DTOs bien definidos.

Comparado con una arquitectura por capas tradicional sin límites fuertes de dominio, la hexagonal reduce el riesgo de controladores inflados y dependencias cruzadas entre módulos críticos.

Alineación directa con los problemas actuales de HealthCore:

1. Historias clínicas fragmentadas por sede.
Respuesta arquitectónica: contexto tenant/sede obligatorio en capa de aplicación y repositorios; contratos de dominio únicos para evitar divergencia funcional.

2. Admisión lenta y manual.
Respuesta arquitectónica: casos de uso de admisión independientes y orquestación clara con el agente IA para automatizar captura/validación inicial sin violar políticas de datos.

3. Baja confianza digital y ausencia histórica de SSL.
Respuesta arquitectónica: backend preparado para operación exclusivamente HTTPS, trazabilidad de accesos y controles de seguridad estandarizados en middleware.

4. Facturación propensa a errores.
Respuesta arquitectónica: módulo de facturación aislado con reglas explícitas, endpoints idempotentes y conciliación desacoplada de la capa de transporte.

5. Falta de centralización ejecutiva.
Respuesta arquitectónica: un backend unificado con esquemas consistentes, auditoría transversal y base común para analítica operacional.

## 3. Estructura de Carpetas y Módulos

Se recomienda una organización por dominios dentro de una base técnica común de FastAPI. El objetivo es que cada dominio conserve sus entidades, casos de uso y routers, compartiendo solo utilidades transversales.

```text
app/
	main.py
	api/
		v1/
			router.py
			admissions.py
			appointments.py
			clinics.py
			agent.py
			billing.py
			patients.py
			auth.py
	core/
		config.py
		security.py
		logging.py
		middleware.py
		auditing.py
		exceptions.py
	dependencies/
		auth.py
		db.py
		tenant.py
		permissions.py
	domain/
		admissions/
			entities.py
			schemas.py
			service.py
			repository.py
		appointments/
			entities.py
			schemas.py
			service.py
			repository.py
		clinics/
			entities.py
			schemas.py
			service.py
			repository.py
		agent/
			entities.py
			schemas.py
			service.py
			repository.py
			triage_rules.py
		billing/
			entities.py
			schemas.py
			service.py
			repository.py
		patients/
			entities.py
			schemas.py
			service.py
			repository.py
	infrastructure/
		db/
			base.py
			session.py
			models/
		repositories/
			admissions_repo.py
			appointments_repo.py
			clinics_repo.py
			agent_repo.py
			billing_repo.py
			patients_repo.py
		external/
			llm_gateway.py
			notification_client.py
			payment_gateway.py
	schemas/
		common.py
		errors.py
	services/
		encryption_service.py
		pii_redaction_service.py
	tests/
		unit/
		integration/
		contract/
```

Criterio de organización:

1. Core centraliza configuración, seguridad, middleware y observabilidad.
2. API contiene exclusivamente transporte HTTP (routers, status codes, DTOs de entrada/salida).
3. Domain encapsula reglas de negocio por módulo sin dependencias a frameworks.
4. Infrastructure implementa persistencia e integraciones externas.
5. Dependencies estandariza inyección de sesión, autenticación y contexto multisede.

Esta estructura evita la mezcla de lógica clínica en endpoints y facilita pruebas unitarias sobre servicios de dominio.

## 4. Organización de Endpoints y Routers (FastAPI APIRouter)

Se define versionado por prefijo y agrupación por dominio: /api/v1.

Gobierno de routers con APIRouter:

1. Cada dominio define su propio APIRouter (admissions_router, appointments_router, clinics_router, agent_router, billing_router).
2. Un router agregador v1 concentra include_router(...) y aplica prefijos, tags y dependencias compartidas.
3. main.py registra únicamente el router agregador, manteniendo un punto de entrada limpio y controlado.
4. Las políticas transversales (autenticación, permisos y auditoría) se inyectan por dependencia en router de dominio o en subrutas críticas.

### 4.1 Admisiones: /api/v1/admissions

1. POST /api/v1/admissions
Responsabilidad: registrar nueva solicitud de admisión, validar identidad mínima y datos administrativos iniciales.

2. GET /api/v1/admissions/{admission_id}
Responsabilidad: consultar estado de admisión y trazabilidad del proceso.

3. PATCH /api/v1/admissions/{admission_id}
Responsabilidad: actualizar datos permitidos durante preingreso (contacto, seguro, documentos).

4. POST /api/v1/admissions/{admission_id}/verify
Responsabilidad: ejecutar verificación documental/reglas de elegibilidad.

### 4.2 Citas: /api/v1/appointments

1. POST /api/v1/appointments
Responsabilidad: crear cita con validación de disponibilidad por sede, especialidad y profesional.

2. GET /api/v1/appointments
Responsabilidad: listar citas por filtros (paciente, sede, fecha, estado).

3. GET /api/v1/appointments/{appointment_id}
Responsabilidad: detalle de una cita.

4. PATCH /api/v1/appointments/{appointment_id}
Responsabilidad: reprogramar o modificar condiciones operativas.

5. DELETE /api/v1/appointments/{appointment_id}
Responsabilidad: cancelación con motivo y auditoría.

### 4.3 Sedes/Clínicas: /api/v1/clinics

1. GET /api/v1/clinics
Responsabilidad: catálogo de sedes activas y capacidades.

2. GET /api/v1/clinics/{clinic_id}
Responsabilidad: detalle operativo de una sede.

3. GET /api/v1/clinics/{clinic_id}/availability
Responsabilidad: disponibilidad agregada para admisiones/citas.

### 4.4 Agente de IA: /api/v1/agent

1. POST /api/v1/agent/intake
Responsabilidad: recibir datos conversacionales iniciales y normalizarlos al formato clínico-administrativo.

2. POST /api/v1/agent/triage
Responsabilidad: clasificar consulta por prioridad y departamento destino con reglas auditables.

3. POST /api/v1/agent/faq
Responsabilidad: responder preguntas frecuentes con contenido gobernado y versionado.

4. POST /api/v1/agent/escalate
Responsabilidad: escalar interacción a equipo humano con contexto completo.

5. GET /api/v1/agent/interactions/{interaction_id}
Responsabilidad: consulta de trazabilidad para control de calidad y cumplimiento.

### 4.5 Facturación: /api/v1/billing

1. POST /api/v1/billing/invoices
Responsabilidad: generar factura desde eventos clínico-administrativos validados.

2. GET /api/v1/billing/invoices/{invoice_id}
Responsabilidad: consultar estado y detalle de facturación.

3. PATCH /api/v1/billing/invoices/{invoice_id}
Responsabilidad: ajustes controlados (no destructivos) con razón de cambio.

4. POST /api/v1/billing/payments
Responsabilidad: registrar pago e integrar confirmación de pasarela.

5. GET /api/v1/billing/reconciliation
Responsabilidad: conciliación operativa para reducir errores manuales.

Lineamientos transversales de routing:

1. Un APIRouter por dominio con tags y prefijos claros.
2. Modelos de respuesta uniformes (éxito/error).
3. Manejo de excepciones centralizado.
4. Idempotencia para operaciones sensibles (admisiones/pagos).

## 5. Convenciones Estándar de FastAPI y Decisiones Técnicas

1. Pydantic para validación estricta.
Se usarán modelos de entrada/salida con tipado fuerte, validaciones de formato (identificadores, fechas, seguros), reglas de consistencia y serialización controlada para campos sensibles. Esto reduce errores de calidad de dato desde el primer punto de captura.

2. Inyección de dependencias con Depends.
Se centralizará en dependencias reutilizables:

- Sesión de base de datos por request.
- Resolución de identidad y roles.
- Contexto de sede/tenant.
- Políticas de autorización por alcance.

Así se evita duplicar lógica de seguridad y se garantiza comportamiento homogéneo en todos los routers.

3. Configuración centralizada con pydantic-settings.
La configuración se declarará en core/config.py mediante clases tipadas:

- Variables de conexión (DB, cache, colas).
- Secretos y claves de firma.
- Parámetros de CORS, dominios permitidos y URLs de frontend.
- Flags de entorno (dev/staging/prod).

Beneficios: trazabilidad de configuración, menor error humano y despliegues repetibles.

4. Seguridad y cumplimiento en middleware/dependencias.

- Middleware de auditoría para accesos a PHI.
- Correlation IDs por request.
- Enmascaramiento/redacción de PII en logs.
- Política consistente de errores sin exponer datos sensibles.

5. Observabilidad operativa.
Métricas y logs estructurados por dominio para detectar cuellos de botella de admisión, fallos de integración del agente y anomalías de facturación.

## 6. Desacoplamiento Frontend/Backend y Comunicaciones

Frontend y backend se operarán como sistemas desacoplados con contrato API explícito.

1. Comunicación REST JSON.
El frontend consume endpoints versionados /api/v1 mediante DTOs estables. Cambios incompatibles se publican en nueva versión de API, evitando rupturas.

2. CORS gestionado por entorno.
FastAPI habilitará CORS con allow_origins restringido por ambiente (dev/staging/prod), métodos/headers controlados y bloqueo por defecto a orígenes no autorizados.

Definición operativa de CORS: CORS (Cross-Origin Resource Sharing) es la política del navegador que determina qué orígenes web pueden invocar la API desde el frontend. En HealthCore no debe usarse "*" en producción; se permiten únicamente dominios corporativos explícitos para reducir superficie de ataque.

3. SSL/HTTPS obligatorio.
Todo tráfico entre cliente y backend deberá ir sobre HTTPS con certificados válidos, HSTS y terminación TLS en edge/reverse proxy. Esto resuelve el riesgo histórico de confianza digital y protege datos en tránsito.

4. Gestión de variables de entorno.

- Frontend: URL base de API, feature flags y configuración no sensible.
- Backend: secretos, DSNs, claves JWT, credenciales de proveedores externos.

No se exponen secretos en cliente ni en repositorio. La rotación de claves debe estar definida por política operativa.

Separación práctica frontend/backend por configuración:

1. Frontend define la URL del backend por entorno (desarrollo, staging, producción) sin recompilar lógica de negocio.
2. Backend expone configuración tipada y validada en arranque; si falta una variable crítica (DB, JWT, CORS), la aplicación falla temprano de forma controlada.
3. Esta disciplina evita desalineaciones entre sedes y despliegues inconsistentes.

5. Contratos y resiliencia.
Se recomienda documentar OpenAPI como fuente de verdad del contrato, añadir pruebas de contrato y aplicar timeouts/reintentos en clientes para degradación controlada.

## 7. Riesgos Arquitectónicos y Puntos de Atención

1. Acoplamiento entre agente de IA y persistencia clínica.
Riesgo: permitir que el módulo del agente escriba directamente en tablas clínicas/facturación sin capa de aplicación.
Impacto: inconsistencias de datos y difícil trazabilidad regulatoria.
Mitigación: imponer puertos de dominio, casos de uso explícitos y auditoría obligatoria por operación.

2. Fugas de PHI por logging y errores no gobernados.
Riesgo: registrar payloads completos de pacientes o propagar excepciones con datos sensibles.
Impacto: incumplimiento HIPAA/UK GDPR, sanciones y daño reputacional.
Mitigación: middleware de redacción de PII, taxonomía de errores segura y política de mínimos datos en logs.

3. Controladores masivos con lógica de negocio embebida.
Riesgo: crecimiento de endpoints monolíticos sin separación en servicios de dominio.
Impacto: baja testabilidad, regresiones frecuentes y tiempos de cambio elevados.
Mitigación: mantener routers delgados, mover reglas a servicios y exigir cobertura en pruebas unitarias/integración.

4. Divergencia funcional entre sedes por falta de contexto tenant.
Riesgo: no propagar consistentemente sede/tenant en autenticación y consultas.
Impacto: acceso cruzado indebido y reportes ejecutivos inconsistentes.
Mitigación: dependencia obligatoria de contexto multisede, filtros por alcance y validaciones de autorización por recurso.

5. Fragilidad de integraciones externas.
Riesgo: integrar pasarela de pagos, notificaciones o proveedor LLM sin timeouts ni circuit breakers.
Impacto: cascada de fallos en admisión/citas/facturación.
Mitigación: adaptadores de infraestructura con reintentos controlados, colas para procesos asíncronos y observabilidad por integración.

6. Gestión deficiente de configuración y secretos.
Riesgo: variables dispersas, valores hardcodeados o rotación manual inconsistente.
Impacto: incidentes de seguridad y despliegues no reproducibles.
Mitigación: pydantic-settings centralizado, gestor de secretos y políticas de rotación/auditoría.

Esta arquitectura prioriza control de riesgo regulatorio, consistencia multisede y capacidad de evolución. La recomendación ejecutiva es implementar por iteraciones de dominio (admisiones, citas y agente IA primero), con criterios de aceptación medibles en seguridad, calidad de dato y tiempos operativos.
