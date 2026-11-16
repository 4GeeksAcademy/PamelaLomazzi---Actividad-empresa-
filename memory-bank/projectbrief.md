# Brief del proyecto — HealthCore

## Contexto del negocio

HealthCore es una red de atención médica ambulatoria fundada en 2011. Opera 12 clínicas en Estados Unidos y el Reino Unido, con servicios de atención primaria, especialidades, manejo de enfermedades crónicas y prevención. HealthCore Digital desarrolla herramientas para que la atención y las operaciones sean más seguras, eficientes y centradas en el paciente.

La infraestructura actual está fragmentada: las clínicas usan distintos sistemas clínicos, los procesos de citas y administración dependen de llamadas y tareas manuales, y la dirección carece de información unificada y oportuna. La web actual tampoco ofrece una experiencia digital bilingüe y confiable. El reto de automatización descrito es facilitar la captación y gestión inicial de consultas de pacientes.

## Objetivos del proyecto de auditoría

- Hacer trazables las lecturas, modificaciones y exportaciones relevantes mediante eventos de auditoría con acceso controlado.
- Proteger la privacidad desde el diseño y reducir la información registrada al mínimo necesario.
- Usar `patient_ref` como único identificador de paciente en eventos, telemetría y contexto de agentes. Debe ser opaco y no incluir ni permitir deducir directamente la identidad.
- Registrar metadatos operativos, nunca PHI: no incluir nombres, datos de contacto, fechas de nacimiento, diagnósticos, texto clínico, payloads, credenciales ni contenido de solicitudes/respuestas.
- Mejorar la coordinación y la eficiencia sin convertir los registros de auditoría en una fuente paralela de información clínica.

`patient_ref` no convierte por sí solo un registro en anónimo ni exime de protección. Tratarlo como dato sensible; restringir acceso, uso, retención y divulgación conforme a la política aprobada.

## Cumplimiento y límites

El diseño debe apoyar las obligaciones aplicables de HIPAA en Estados Unidos y UK GDPR en el Reino Unido, incluyendo minimización, control de acceso, confidencialidad, seguridad y manejo justificado de datos. La jurisdicción, residencia, transferencias, base legal, retención y obligaciones de proveedores deben validarse con responsables de cumplimiento antes de usar datos reales.

Estas instrucciones son controles de ingeniería, no una opinión legal ni una declaración de certificación o cumplimiento integral. Usar únicamente datos sintéticos en desarrollo y pruebas. Si aparece posible PHI en código, logs o fixtures, no copiarla a informes; detener la exposición y escalarla por el canal seguro aprobado.

## Ubicación del código de producto

El código nuevo de producto solo puede ubicarse en los destinos previstos: `/uis/website` para la web pública, `/uis/backoffice` para la aplicación interna y `/services` para APIs backend. No crear árboles de producto paralelos en otras carpetas ni duplicar servicios. La estructura existente no se reorganiza como parte de esta instrucción; cualquier migración requiere aprobación explícita.
