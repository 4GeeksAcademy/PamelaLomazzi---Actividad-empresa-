# Regla: impedir PHI en logs y auditoría

## Alcance

Obligatoria para todo agente y todo código bajo este repositorio: APIs, frontend, workers, scripts, pruebas, manejo de errores, telemetría y prompts/contexto de agentes. Aplica a logs de aplicación, eventos de auditoría, trazas, métricas con etiquetas y mensajes de error.

## Requisitos

- Usar `patient_ref` opaco como única referencia de paciente. No registrar ni propagar nombres, datos de contacto, fecha de nacimiento, dirección, números de expediente, diagnósticos, texto libre clínico, payloads o identificadores alternativos de paciente.
- Incluir solo metadatos operativos aprobados y necesarios (por ejemplo, actor autorizado, acción, instante, resultado y referencia opaca). No agregar campos abiertos de contexto.
- Nunca registrar tokens, cookies, claves, cabeceras de autorización, cuerpos de solicitud/respuesta ni valores de parámetros que puedan contener PHI.
- No asumir que `patient_ref` está desidentificado: protegerlo con mínimo privilegio, retención limitada y controles de acceso.
- Rechazar campos de evento no permitidos; no “sanitizar” y luego conservar texto clínico libre.
- Ante una posible fuga, detener la salida del dato, no repetirlo en el informe y escalar por el canal seguro aprobado.

## Verificación

Antes de aprobar cambios, inspeccionar los puntos de logging y el esquema de eventos para confirmar que no se emiten valores sensibles y que `patient_ref` es el único identificador de paciente. Revisar también las ramas de error, depuración y pruebas. La ausencia de coincidencias de texto no es prueba suficiente: verificar el flujo de datos y el esquema allowlist.

## Ubicación de código

El código nuevo de producto solo se permite en `/uis/website`, `/uis/backoffice` y `/services`, según su función. No crear carpetas paralelas para aplicaciones, APIs o datos de producto.
