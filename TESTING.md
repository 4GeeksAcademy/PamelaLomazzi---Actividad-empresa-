# Plan de pruebas unitarias

## 1. Estrategia y Principios

El plan prioriza la **lógica de negocio observable** y los contratos de cada función: validaciones de entrada, normalización de datos, unicidad de usuarios, autenticación, emisión y vencimiento de tokens, autorización por roles y comportamiento en los bordes. Las pruebas deben ser deterministas, aisladas y rápidas; usar datos mínimos explícitos y controlar el reloj o los datos temporales cuando sea necesario.

No se busca probar la serialización HTTP, el enrutamiento ni los detalles internos de FastAPI, Pydantic, Next.js o Jest. Para las pruebas de lógica se invocarán servicios, funciones y helpers directamente, sustituyendo dependencias externas (por ejemplo, base de datos, reloj o proveedores de tokens) cuando corresponda. Las pruebas de endpoints de API-042 verificarán resultados funcionales relevantes, no estructuras internas del framework.

Cada comportamiento se organizará en tres niveles:

1. **Camino feliz (Happy path):** entrada válida y resultado esperado; por ejemplo, registro aceptado o token activo reconocido.
2. **Caso límite (Edge case):** valores válidos o cercanos a una frontera que suelen revelar errores; por ejemplo, espacios en blanco, diferencias de mayúsculas, listas vacías o un token en el instante límite de expiración.
3. **Modo de fallo (Failure mode):** entrada inválida o condición de negocio no permitida; verificar rechazo controlado, sin exponer datos sensibles ni dejar cambios parciales.

## 2. Matriz de Casos de Prueba

Los siguientes casos describen la **cobertura objetivo** para AUTH-088, API-042 y FE-019. En el backend, las rutas indicadas son relativas a `services/api/`. La suite existente en este repositorio contiene pruebas de análisis CSV e integración de incidencias; los archivos de autenticación y backoffice de esta matriz aún deben incorporarse. La carpeta de pruebas de Jest también requiere configuración si todavía no se ha añadido.

### Backend (FastAPI / pytest)

| Archivo / ticket | Nivel | Escenario | Resultado que se debe comprobar |
|---|---|---|---|
| `tests/test_register.py` — AUTH-088 | Happy path | Registrar un usuario con nombre, email y contraseña válidos. | Se crea el usuario esperado, se conserva la contraseña de forma segura (hash, nunca texto plano) y se devuelve el resultado de negocio de registro exitoso. |
| `tests/test_register.py` — AUTH-088 | Edge case | Enviar campos vacíos o compuestos solo por espacios; incluir espacios alrededor de campos que deban normalizarse. | Los valores vacíos tras normalización se rechazan; los campos normalizables se procesan de forma consistente. No se crea un usuario inválido. |
| `tests/test_register.py` — AUTH-088 | Failure mode | Intentar registrar de nuevo un email ya existente (incluyendo la forma normalizada si el email no distingue mayúsculas). | La operación se rechaza como duplicado y no altera el usuario original ni crea un segundo registro. |
| `tests/test_login.py` — AUTH-088 | Happy path | Iniciar sesión con credenciales correctas. | Se autentica la identidad correcta y se emite un JWT con los claims y vigencia previstos por el contrato de autenticación. |
| `tests/test_login.py` — AUTH-088 | Edge case | Variar mayúsculas/minúsculas en email y contraseña por separado. | Se comprueba la política definida: normalización del identificador si corresponde y contraseña sensible a mayúsculas/minúsculas. |
| `tests/test_login.py` — AUTH-088 | Failure mode | Usar email inexistente o contraseña incorrecta. | El acceso se deniega con un resultado de autenticación fallida; no se emite token y la respuesta no revela si la cuenta existe. |
| `tests/test_token.py` — AUTH-088 | Happy path | Validar un JWT con firma correcta y `exp` posterior al instante actual. | Se acepta el token y se obtiene la identidad/claims esperados. |
| `tests/test_token.py` — AUTH-088 | Edge case | Validar un token próximo a expirar, controlando el reloj para que quede un delta pequeño y positivo. | Se acepta mientras siga vigente según la política; la prueba no depende del tiempo real ni de pausas. |
| `tests/test_token.py` — AUTH-088 | Failure mode | Validar un token expirado o con firma/estructura malformada. | Se rechaza de forma segura; nunca se autentica una identidad ni se filtran detalles criptográficos sensibles. |
| `tests/test_backoffice.py` — API-042, incidencias/recursos | Happy path | Consultar y operar sobre incidencias y recursos con usuario autorizado y datos válidos. | Se obtienen o modifican los datos de negocio esperados, respetando filtros, estados y relaciones aplicables. |
| `tests/test_backoffice.py` — API-042, incidencias/recursos | Edge case | Consultar colecciones vacías, identificadores en límites válidos y filtros sin coincidencias. | Se conserva el resultado funcional definido para conjuntos vacíos y límites, sin errores inesperados ni datos ajenos. |
| `tests/test_backoffice.py` — API-042, incidencias/recursos | Failure mode | Solicitar un recurso inexistente o intentar una transición inválida/no autorizada. | La operación se rechaza de manera controlada y no deja cambios parciales. |
| `tests/test_backoffice.py` — API-042, usuarios/roles | Happy path | Consultar usuarios/roles y asignar un rol permitido con permisos suficientes. | Se refleja la asignación correcta y las capacidades resultantes corresponden a la política de roles. |
| `tests/test_backoffice.py` — API-042, usuarios/roles | Edge case | Consultar sin usuarios, repetir una asignación ya vigente o probar el límite de privilegios definido. | El sistema aplica una política consistente e idempotente cuando corresponda, sin duplicar asignaciones ni ampliar permisos. |
| `tests/test_backoffice.py` — API-042, usuarios/roles | Failure mode | Usuario sin privilegios intenta administrar roles, asignar un rol desconocido o modificar un usuario inexistente. | Se deniega la operación y no se cambia el usuario ni sus permisos. |

### Frontend (TypeScript / Jest) — Ticket FE-019

Archivo objetivo: `uis/talent-pipeline-tracker/__tests__/utils.test.ts`. Cubrir al menos un caso exitoso y uno de fallo para cada tipo de utilidad. Si `parseResponse` u otros helpers no son exportables actualmente, se recomienda extraerlos a un módulo de utilidades o exponer una interfaz de prueba estable en vez de acoplar las pruebas a detalles privados.

| Utilidad / helper | Happy path | Failure mode |
|---|---|---|
| Parser de API, por ejemplo `parseResponse` | Una respuesta correcta con JSON devuelve el payload esperado; una respuesta correcta no JSON sigue la convención definida por el helper. | Una respuesta no exitosa produce un error con el mensaje de negocio disponible (`detail`/`message`) o un fallback estable cuando no hay payload interpretable. |
| Validador de formularios | Un formulario con campos requeridos válidos y normalizados pasa la validación. | Campos requeridos ausentes, vacíos o con formato inválido generan errores de validación y no se aceptan como datos válidos. |
| Formateador de fechas | Una fecha válida produce el formato esperado de manera determinista, fijando locale/zona horaria en el test si afecta al resultado. | Una fecha inválida o vacía sigue la política definida (error controlado, marcador o valor vacío) y no genera una fecha engañosa. |

## 3. Guía de Ejecución de Pruebas

### Backend

Desde la raíz del monorepo, instalar las dependencias del API y la extensión de cobertura en el entorno `uv` si aún no están disponibles:

```bash
uv pip install -r services/api/requirements-dev.txt pytest-cov
```

Ejecutar todas las pruebas backend con reporte de cobertura desde la carpeta del servicio:

```bash
cd services/api
uv run pytest --cov
```

Para limitar la ejecución a los casos descritos en los tickets:

```bash
uv run pytest tests/test_register.py tests/test_login.py tests/test_token.py tests/test_backoffice.py --cov
```

El reporte de terminal muestra la cobertura por módulo. Para generar también un informe HTML:

```bash
uv run pytest --cov --cov-report=term-missing --cov-report=html
```

### Frontend

Desde el directorio de la aplicación, asegúrese de que Jest, `ts-jest` (o la transformación TypeScript elegida) y sus tipos estén instalados y configurados. El `package.json` actual de la aplicación no declara un script ni dependencias de Jest, así que ese setup debe añadirse como parte de FE-019 si aún no existe.

```bash
cd uis/talent-pipeline-tracker
npm install
npx jest --coverage
```

Para ejecutar únicamente el archivo objetivo:

```bash
npx jest __tests__/utils.test.ts --coverage
```

Los comandos se ejecutan desde cada proyecto porque el monorepo no tiene un runner ni configuración de pruebas global en la raíz. Conviene incorporar los comandos a CI una vez que dependencias, configuración y umbrales de cobertura estén acordados.

## 4. Hallazgos y Descubrimientos asistidos por IA

- **Caso límite de AUTH-088 identificado durante el diseño asistido por IA:** probar la expiración exacta del JWT, cuando `exp` coincide con el instante actual y el delta de tiempo es cero. La suite debe fijar el reloj y documentar la convención elegida; se recomienda tratar `now >= exp` como expirado para evitar aceptar un token en su frontera de vencimiento. Esto complementa el caso de token próximo a expirar, cuyo delta todavía es positivo.
- **Bug detectado y corrección definida durante el diseño de las pruebas:** una validación que solo considera expirado el token cuando `exp < now` acepta indebidamente un JWT cuyo `exp` coincide exactamente con `now`. La prueba de regresión para delta cero debe detectar ese caso y la corrección es considerar expirado el token cuando `now >= exp`. El repositorio revisado no contiene actualmente el módulo ni los tests de autenticación, así que el defecto y su arreglo quedan documentados como hallazgo/corrección requeridos para AUTH-088; no se afirma que el código ya haya sido modificado.
- **Observación de alcance:** ya existen pruebas de servicio y router para el análisis/exportación de CSV de incidencias en `services/api/tests/`; deben mantenerse al añadir los casos de API-042 y no sustituir la matriz de incidencias/recursos de backoffice.
