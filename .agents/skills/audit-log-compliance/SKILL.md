---
name: audit-log-compliance
description: Revisa si un esquema o cambio de logs de auditoría evita PHI y usa exclusivamente patient_ref para identificar pacientes.
---

# Auditoría de conformidad de logs

## Objetivo único

Evaluar un esquema, implementación o diff de eventos de auditoría frente a las reglas de privacidad de HealthCore. La skill revisa; no cambia código ni certifica cumplimiento legal.

## Inputs

- Archivos de esquema, escritor de auditoría y sitios de logging relevantes, o un diff acotado.
- La allowlist de campos aprobada para el evento, si existe.
- Fixtures de ejemplo exclusivamente sintéticos, si se necesitan para revisar valores.

No solicitar ni aceptar logs reales, PHI, credenciales, tokens, cookies ni dumps de bases de datos. Si el usuario aporta accidentalmente un valor posiblemente sensible, no reproducirlo en la salida.

## Procedimiento

1. Identificar los campos del esquema, argumentos del logger y rutas de registro normal, error y depuración.
2. Confirmar que `patient_ref` es la única referencia de paciente y que no se trata como prueba de identidad o autorización.
3. Buscar campos clínicos, datos personales, identificadores alternativos, texto libre, cuerpos, cabeceras, tokens y cookies; verificar también los valores derivados y excepciones.
4. Comparar todos los campos emitidos con la allowlist y comprobar que las entradas adicionales se rechazan.
5. Informar el resultado con archivos/ubicaciones y nombres de campos únicamente; nunca copiar valores sensibles. Indicar explícitamente qué rutas no pudieron verificarse.

## Criterios de aceptación verificables

- **Aprobado:** cada ruta de auditoría emite únicamente campos de metadatos aprobados y `patient_ref`; no hay PHI, credenciales, payloads ni campos libres; campos adicionales se rechazan; el informe identifica alcance y límites.
- **Rechazado:** se encuentra o no puede descartarse un campo/valor sensible, se acepta otra identidad de paciente, se registra contenido de solicitudes/respuestas, hay contexto libre sin allowlist, o no se puede revisar una ruta relevante.
- No afirmar cumplimiento total de HIPAA o UK GDPR basándose solo en esta revisión.
