# Contexto técnico — HealthCore

## Stack conocido

- **Backend:** Python y FastAPI; SQLModel y PostgreSQL aparecen en las dependencias del servicio. Hay servicios FastAPI bajo `services/` y `services/api/`.
- **Web pública:** Vite 7.3.1, Tailwind CSS 4.0 y JavaScript en `uis/website`.
- **Aplicación web interna:** Next.js 16.2.10, React 19.2.4 y TypeScript 5 en la aplicación existente bajo `uis/talent-pipeline-tracker`.
- **Supabase:** solicitado como parte del stack objetivo, pero no aparece declarado en los manifiestos de dependencias revisados. No asumir que está conectado, ni crear tablas, políticas o credenciales de Supabase sin verificar el diseño aprobado.

Las versiones anteriores reflejan los manifiestos revisados; al cambiar dependencias, volver a comprobarlas. No hay un runner de workspace global configurado.

## Decisiones y restricciones

- Mantener separado el frontend público, la aplicación interna y las APIs. El código de producto nuevo debe ir exclusivamente en `/uis/website`, `/uis/backoffice` o `/services`, según su responsabilidad. No inventar árboles paralelos. La aplicación Next.js actual permanece donde está hasta que el desarrollador apruebe una migración.
- Las respuestas de inventario usan caché en memoria con TTL e invalidación tras escrituras; las respuestas HTTP mantienen `Cache-Control: no-store`. La caché no es autenticación, control de autorización ni almacenamiento compartido entre procesos.
- Para eventos de auditoría, permitir únicamente metadatos aprobados y `patient_ref` como referencia de paciente. Rechazar campos adicionales y no registrar PHI, payloads clínicos, tokens o cookies.
- Los identificadores y referencias de auditoría deben tratarse como sensibles, aunque sean opacos. No aceptar `user_uuid` ni `patient_ref` aportados por el cliente como prueba de identidad o autorización.
- El verificador JWT del área de auditoría depende de un emisor confiable y de configuración segura del secreto. La partición de caché por huella de credenciales no valida tokens ni concede permisos.
- No guardar información clínica en memoria de agente, prompts, telemetría o logs. Usar datos sintéticos, controles de mínimo privilegio y respuestas sin campos clínicos.
- Los controles descritos no sustituyen una evaluación legal, análisis de riesgo, ni la validación del despliegue y de los proveedores.

## Documentación de referencia

- `HealthCore.md`: contexto de negocio disponible.
- `CACHING_REPORT.md`: decisiones, límites y verificación de optimizaciones.
- `audit/HEALTHCORE_COMPLIANCE_REVIEW.md`: estado y límites de la implementación de auditoría documentada.

El briefing técnico original citado en parte de la documentación de auditoría no está presente en la raíz revisada. No inferir requisitos adicionales de un documento no disponible.
