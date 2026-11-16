# Implementación de auditoría HealthCore

## Alcance

`healthcore-BRIEFING.md` no está presente en la raíz ni aparece en una búsqueda recursiva del workspace actual. Esta actualización implementa los cuatro requisitos descritos en la solicitud; no puede confirmar criterios adicionales del briefing original.

## Estado actual

| Requisito | Estado | Implementación |
|---|---|---|
| PHI: entradas sin nombres/contenido clínico y `patient_ref` opaco | **Cumple en el esquema de auditoría** | Modelo con UUIDs y metadatos allowlistados; el schema rechaza propiedades extra; respuesta del visor no incluye contenido clínico. |
| RBAC del visor | **Cumple, condicionado a configurar el emisor de tokens** | Admin consulta todos los metadatos, Supervisor solo su departamento, Empleado recibe 403. JWT firmado, con issuer/audience/claims validados. |
| Seed de auditoría | **Cumple** | El arranque mantiene 15 eventos sintéticos con IDs deterministas, lecturas, modificaciones y exportaciones; es idempotente incluso si ya hay eventos reales. |
| Detección de ráfagas | **Cumple como alerta básica** | Marca y registra el cruce de 10 eventos por usuario en 300 segundos. |

## Evidencia por requisito

### Privacidad de PHI

[services/models.py](../services/models.py) define `AuditEvent` sin columnas para nombre, diagnóstico, texto libre o payload clínico; los identificadores de actor y paciente son UUID. [services/schemas.py](../services/schemas.py) limita la entrada a `patient_ref` y `action` con `extra="forbid"`, y define una respuesta con campos permitidos únicamente. [services/audit.py](../services/audit.py) persiste esos datos y emite una advertencia de anomalía que contiene solo `actor_id`, cantidad y ventana temporal.

Las referencias de los datos demo son UUID sintéticos, sin tabla de correspondencia con identidad real. La restricción aplica a los eventos creados a través de `record_audit_event`; las rutas clínicas existentes aún no están implementadas ni conectadas a este servicio.

### Control de acceso

[services/security.py](../services/security.py) valida tokens Bearer firmados con HS256, issuer `healthcore`, audience `healthcore-audit`, expiración, subject UUID, rol y departamento. [services/routers/audit.py](../services/routers/audit.py) publica `GET /api/audit/events`: Admin ve solo el esquema de metadatos seguro, Supervisor recibe filtro obligatorio por su departamento y Empleado obtiene 403.

El entorno debe configurar `AUDIT_JWT_SECRET` con al menos 32 caracteres y el emisor de identidad debe firmar los claims indicados. No se añadió un emisor/login propio; el backend verifica tokens confiables.

### Seed data

[services/audit.py](../services/audit.py) genera 15 eventos sintéticos con referencias UUID y acciones `read`, `modify` y `export`. Usa IDs deterministas para insertarlos una sola vez, sin depender de si existen eventos de uso real en la tabla. [services/main.py](../services/main.py) ejecuta el seed tras inicializar el esquema de la base de datos.

### Detección de ráfagas

[services/audit.py](../services/audit.py) cuenta en SQL los eventos del mismo actor dentro de una ventana deslizante de 300 segundos. Al llegar al décimo, marca `anomaly_detected` y emite un warning sin datos de paciente. El umbral actual es una constante configurable en código, no un motor adaptativo.

## Límites de integración

El backend actual no contiene endpoints de historias clínicas. Por tanto, el escritor queda disponible como `record_audit_event` para invocarse desde cada operación clínica real; el seed solo provee datos de demostración. La garantía operativa requiere que toda lectura, modificación y exportación clínica futura pase por ese servicio. El visor no funcionará hasta configurar el secreto y conectar un emisor de tokens confiable.

## Validación

Suite API: `pytest -q services/api/tests` (15 pasaron; un warning deprecado de Starlette/httpx). Compilación: `python -m compileall -q services` (sin errores). El analizador del editor no reportó errores en los archivos modificados.