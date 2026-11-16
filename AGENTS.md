# Instrucciones para agentes — HealthCore

## Lectura obligatoria al inicio de cada sesión

Antes de inspeccionar o modificar código, todo agente debe leer completos y en este orden:

1. `memory-bank/projectbrief.md`
2. `memory-bank/techContext.md`
3. `memory-bank/progress.md`
4. `.agents/rules/phi-audit-logs.md`

Si una instrucción del usuario parece contradecir estas restricciones de privacidad o ubicación, no asumir una excepción: pedir confirmación explícita al desarrollador.

## Ubicación de código

El código nuevo de producto solo puede ubicarse en `/uis/website` (web pública), `/uis/backoffice` (aplicación interna) o `/services` (APIs backend). No crear árboles de producto paralelos ni duplicar esas responsabilidades en carpetas inventadas. La aplicación Next.js existente bajo `uis/talent-pipeline-tracker` no se mueve sin autorización expresa.

## Flujo obligatorio antes de cada commit

Completar los pasos en orden y revisar los resultados del paso anterior; si falla un paso, no hacer commit:

1. **Sintaxis y tipos:** ejecutar la comprobación de sintaxis/tipos apropiada para los archivos cambiados. Para Python, validar/importar el código del servicio; para TypeScript, ejecutar el chequeo del proyecto correspondiente y lint cuando estén configurados.
2. **Pruebas unitarias focalizadas:** ejecutar las pruebas que cubren el cambio (por ejemplo, `PYTHONDONTWRITEBYTECODE=1 python -m pytest services -q` para el backend existente). No sustituir pruebas faltantes por una afirmación de éxito.
3. **Revisión estricta de seguridad y PHI:** inspeccionar diff, rutas de logging, errores, fixtures y eventos. Confirmar que `patient_ref` es el único identificador de paciente, que no se registra PHI ni credenciales y que autorización no depende de IDs del cliente. Si hay una posible exposición, detenerse y escalar sin copiar el valor.
4. **Revisión del diff:** verificar que el cambio es acotado, no altera controles de privacidad sin autorización y no incorpora datos reales, secretos o archivos generados.
5. **Verificación de Git:** ejecutar `git status --short` y revisar el diff staged/unstaged para confirmar que solo se incluyen los archivos previstos y que no quedan archivos sensibles.

## Archivos y áreas protegidos

El agente NUNCA debe modificar estos elementos sin confirmación explícita del desarrollador:

- `HealthCore.md`, fuente del contexto empresarial.
- `services/security.py`, `services/database.py`, `services/models.py`, `services/schemas.py`, `services/audit.py` y `services/routers/audit.py`, incluidos contratos de auditoría, identidad, permisos y datos.
- `docker-compose.yml`, todo `infra/`, archivos de despliegue y configuraciones de producción.
- Cualquier `.env*`, secreto, credencial, migración de base de datos o política/función de Supabase, presente o futura.
- El formato, el conjunto permitido de campos o la semántica de `patient_ref` y los eventos de auditoría.

No leer ni copiar secretos o datos reales para cumplir una tarea. Si se requiere cambiar un elemento protegido, detenerse y pedir autorización antes de editarlo.
