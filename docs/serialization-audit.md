# Auditoría de serialización del backend FastAPI

Fecha: 2026-11-10. Alcance: rutas registradas por `services.main:app`, sus
routers, modelos y esquemas de salida. `services.api.main:app` reexporta la
misma aplicación; no representa otra API ni duplica los endpoints.
Actualizada tras implementar y verificar las mejoras de serialización del backend.

## Criterios

- ✅ **Ya serializado**: contrato de salida específico que valida y limita los
  campos públicos. Devolver una instancia ORM con `response_model` válido
  pertenece a esta categoría: no equivale a exponer el ORM sin filtro.
  También incluye formatos no JSON construidos de forma controlada y
  documentados con su tipo de contenido, como la exportación CSV.
- ⚠️ **Parcialmente serializado**: hay conversión a JSON o CSV, pero falta un
  contrato específico de campos, tipos o documentación del formato real.
- ❌ **Sin serializar**: salida de datos de aplicación sin contrato ni una
  transformación pública controlada, especialmente un ORM sin filtro.

No tener `response_model` explícito no implica que FastAPI no serialice:
también puede inferirlo desde la anotación de retorno. Estas categorías
evalúan el contrato público, no solo si la respuesta puede convertirse a JSON.
La clasificación de cada ruta se refiere a su respuesta de éxito; los errores
se evalúan por separado más abajo.

## Inventario de endpoints funcionales

Las rutas de esta tabla son las efectivas, incluidos los prefijos de routers.

| Método | Ruta | Propósito | Respuesta actual | Estado | Mejora y salida esperada |
| --- | --- | --- | --- | --- | --- |
| GET | `/` | Identificar la API y confirmar disponibilidad básica. | `response_model=RootResponse`; devuelve un modelo con `status: Literal["ok"]` y `message: str`. HTTP 200. | ✅ Ya serializado | Contrato explícito implementado. Mantiene `{"status":"ok","message":"HealthCore API v1"}` sin campos internos. |
| GET | `/health` | Comprobación básica de disponibilidad del proceso; no comprueba la base de datos. | `response_model=HealthResponse`; devuelve un modelo con `status: Literal["ok"]`. HTTP 200. | ✅ Ya serializado | Contrato explícito implementado. Mantiene `{"status":"ok"}` sin configuración ni información interna. |
| GET | `/records` | Listar cuatro candidatos de demostración con metadatos de paginación fijos. | `response_model=RecordsResponse`, con `data: list[CandidateResponse]`. Valida campos, fechas, URL, estados, nulos y contadores. HTTP 200. | ✅ Ya serializado | Contrato público específico implementado; excluye campos no declarados. La autorización de datos personales sigue siendo una necesidad independiente de la serialización. |
| GET | `/inventory/products` | Listar productos por nombre con existencias calculadas. | `response_model=list[MedicalSupplyResponse]`; devuelve modelos de salida construidos por `_supply_response`, no ORM sin filtro. HTTP 200. | ✅ Ya serializado | Mantener la lista de productos públicos descrita abajo. No requiere corrección de serialización del éxito. |
| POST | `/inventory/products` | Crear un producto con existencias iniciales cero. | `response_model=MedicalSupplyResponse`; guarda ORM y devuelve un modelo de salida con `current_stock=0`. HTTP 201. | ✅ Ya serializado | Mantener un objeto de producto público. No requiere corrección de serialización del éxito. |
| GET | `/inventory/products/{supply_id}` | Obtener un producto y sus existencias. | `response_model=MedicalSupplyResponse`; transforma ORM en modelo de salida. HTTP 200; 404 si no existe. | ✅ Ya serializado | Mantener un objeto de producto público y documentar el error 404. |
| POST | `/inventory/deliveries` | Registrar una entrada de existencias. | Devuelve una instancia ORM `SupplyDelivery`, filtrada y validada por `response_model=SupplyDeliveryResponse`, con `from_attributes=True`. HTTP 201; 404 si el producto no existe. | ✅ Ya serializado | Mantener el contrato de entrada de existencias; revisar necesidad de exponer `user_uuid` y separar campos públicos de entrada/salida cuando evolucionen. No hay exposición de ORM sin filtro. |
| POST | `/inventory/consumptions` | Registrar un consumo o descarte sin superar las existencias. | Devuelve ORM `SupplyConsumption`, filtrado y validado por `response_model=SupplyConsumptionResponse`, con `from_attributes=True`. HTTP 201; 404 o 400 según el caso. | ✅ Ya serializado | Mantener el contrato de consumo; revisar `user_uuid` y documentar errores. No hay exposición de ORM sin filtro. |
| GET | `/inventory/orders` | Unificar entradas y consumos, del más reciente al más antiguo. | `response_model=list[InboundOrderResponse \| OutboundOrderResponse]`; construye modelos públicos con nombre del producto y tipo de movimiento. HTTP 200. | ✅ Ya serializado | Mantener ambas variantes; opcionalmente usar una unión discriminada por `order_type` para hacer explícita la selección de esquema. No es un fallo actual de serialización. |
| POST | `/api/incidents/analyze` | Analizar un CSV y devolver métricas agregadas. | `response_model=IncidentMetricsResponse`; construye explícitamente un modelo Pydantic. HTTP 200; declara `ErrorResponse` para 400. | ✅ Ya serializado | Mantener únicamente métricas agregadas; no devolver las filas originales ni identificadores personales. Véase el contrato detallado. |
| GET | `/api/incidents/results/export` | Descargar las métricas del último análisis guardado en memoria. | `response_model=None` y `response_class=StreamingResponse` explícitos; CSV generado con `csv.writer`. HTTP 200 documentado como `text/csv`, columnas `metric,value` y cabecera `Content-Disposition`; 400 con `ErrorResponse`. | ✅ Ya serializado | Contrato CSV explícito implementado. Se conserva `results.csv` y la selección controlada de métricas; no aplica validación JSON Pydantic a una respuesta de streaming. |

Resumen: **11 endpoints funcionales: 11 ✅, 0 ⚠️ y 0 ❌**. No se encontró
ninguna ruta que entregue ORM sin un esquema público de salida.
Todos los decoradores de las rutas funcionales declaran `response_model`;
el CSV declara `None` deliberadamente para conservar su formato no JSON.

## Contratos de salida

Los nombres siguientes describen los campos actuales que deben conservarse,
salvo que una revisión de permisos justifique reducirlos. Los esquemas de
salud y candidatos están implementados en `services/schemas.py`.

### Candidatos

Sobre: `total: int`, `page: int`, `limit: int`, `data: list[CandidateResponse]`.
Actualmente los valores son `4`, `1`, `4` y cuatro registros; no existe
paginación configurable en esta ruta.

Cada candidato contiene:

- `id`, `full_name`, `email`, `phone`, `position`: cadenas.
- `linkedin_url`, `cv_url`: URL o `null`; actualmente ambos son `null`.
- `experience_years`, `notes_count`: enteros no negativos.
- `status`, `stage`: valores restringidos al catálogo del dominio.
- `applied_at`, `updated_at`: fechas y horas ISO 8601.

El esquema implementado declara las claves exactas, su nulabilidad y sus
tipos; las URL usan `HttpUrl`, las fechas `datetime`, los estados y etapas
`Literal` y los contadores restricciones numéricas. Nombre, correo, teléfono
y enlaces de CV son datos personales: un
serializador no sustituye la autorización. Aunque hoy sean datos ficticios,
no se debe conectar esta ruta a datos reales sin controlar acceso y campos.

### Inventario

- `MedicalSupplyResponse`: `id: int`, `name`, `sku`, `category`, `unit`,
  `country` como cadenas y `current_stock: int`. Los GET de lista devuelven
  un array; creación y detalle devuelven un objeto.
- `SupplyDeliveryResponse`: `id: int`, `supply_id: int`, `quantity: int > 0`,
  `vendor_name: str`, `clinic_id: int` entre 1 y 12, `user_uuid: str`,
  `created_at: datetime` serializado como cadena ISO 8601.
- `SupplyConsumptionResponse`: `id: int`, `supply_id: int`, `quantity: int > 0`,
  `consumption_type: "clinical_use" | "expiry_waste"`, `clinic_id: int` entre
  1 y 12, `user_uuid: str`, `created_at` como cadena ISO 8601.
- Órdenes: array con los campos de una entrega más
  `order_type: "inbound"` y `product_name: str`, o los campos de un consumo
  más `order_type: "outbound"` y `product_name: str`.

Los esquemas de salida de productos, entregas y consumos son modelos
Pydantic independientes de los esquemas de creación. Cada uno declara
explícitamente sus campos públicos, de modo que añadir un campo de entrada
no lo incorpora automáticamente a la salida. Los esquemas de órdenes
heredan únicamente de otros esquemas de salida.
Usar `model_dump()` del ORM dentro de un constructor de respuesta no implica
por sí solo que todos los campos del ORM lleguen al cliente: el esquema
público sigue delimitando la salida.

### Métricas y CSV

`IncidentMetricsResponse` contiene únicamente:

- `total_processed`, `total_valid`, `total_invalid`, `closed_scores_count`:
  enteros.
- `invalid_reason_counts`, `category_counts`, `status_counts`:
  objetos con claves de texto y valores enteros.
- `avg_closed_satisfaction`: número o `null`.

La exportación contiene la cabecera `metric,value` y dos columnas de texto.
Incluye `total_registros_procesados`, `total_registros_validos`,
`total_registros_invalidos`, filas `conteo_categoria:<categoria>`,
`conteo_estado:<estado>`, `invalidos:<motivo>`,
`satisfaccion_media_cerrados` y `cantidad_casos_cerrados_con_satisfaccion`.
La media se formatea con dos decimales o `N/A`, en lugar del `null` del JSON.
No exporta las filas originales del archivo subido.

El formato y `Content-Disposition` están documentados en OpenAPI. Si se introduce
autenticación debe vincularse el resultado a un usuario o análisis autorizado:
`_last_result` es una variable global compartida entre solicitudes del mismo
proceso y podría entregar a otro usuario las métricas del último análisis.
Es un riesgo de aislamiento de datos, no un fallo de codificación CSV.

## Errores y respuestas fuera del modelo de éxito

- Incidencias declara `responses={400: {"model": ErrorResponse}}`, cuyo
  payload es `{"detail":"mensaje público"}`. Esa declaración documenta el
  error, pero no valida en ejecución el contenido de `HTTPException`.
  Los errores actuales usan mensajes controlados; `InvalidCSVError` no
  devuelve trazas ni el contenido completo del archivo.
- Inventario utiliza `HTTPException` con `{"detail":"mensaje público"}`
  para 404 y, en consumos, 400. Conviene documentar esos códigos mediante
  un esquema de error común; no están cubiertos por el `response_model`
  de éxito.
- FastAPI puede responder 422 ante entradas inválidas con
  `{"detail":[...]}`. No coincide con `ErrorResponse`, cuyo `detail` es una
  cadena. Los detalles de validación pueden incluir el valor recibido:
  revisar y sanear esos errores antes de introducir credenciales.
- No se identifican manejadores propios de excepciones en los módulos
  revisados. No devolver excepciones, SQL, configuración, trazas o secretos
  en errores; los errores 500 no deben publicarse con depuración activada.

## Autenticación y datos sensibles

**No existen endpoints de autenticación en el backend revisado**: no hay
login, registro de usuarios, refresh, logout ni perfil autenticado. Tampoco
se identifican modelos de usuario con contraseñas o hashes, ni dependencias
de autenticación en las rutas inventariadas. No se observa una fuga actual
de contraseñas o hashes en sus payloads; esto no acredita que la API tenga
control de acceso.

`user_uuid` es una cadena proporcionada por el cliente en entregas y consumos.
No es una credencial ni demuestra identidad; debería derivarse del usuario
autenticado en el servidor cuando exista autenticación. Su exposición en
respuestas debe justificarse por permisos y necesidades del consumidor.

Requisitos para futuros endpoints de autenticación, no rutas existentes:

- Login o renovación: un DTO de salida como
  `{"access_token":"<token>","token_type":"bearer"}`; añadir únicamente
  metadatos necesarios. No reutilizar el esquema de credenciales de entrada.
- Registro o perfil: un DTO público con, por ejemplo, `id`, `display_name`
  y, solo para consumidores autorizados, `email`. Nunca devolver el ORM de
  usuario sin un `response_model` público específico.
- Excluir siempre `password`, `hashed_password`, `password_hash`, hashes
  equivalentes, sales, secretos MFA y tokens de recuperación. Un hash de
  contraseña también es secreto. No basta con ocultarlos en el frontend.
- Verificar también errores 422, respuestas de error y registros de
  diagnóstico: ninguna credencial debe reaparecer fuera de su uso previsto.
  Los tokens emitidos solo deben aparecer en la respuesta de autenticación
  prevista o en cookies protegidas, según el diseño adoptado.

## Rutas automáticas de FastAPI

Además de las 11 rutas funcionales, la configuración por defecto habilita
cuatro rutas de infraestructura. Admiten GET y HEAD mediante Starlette y
no son operaciones de negocio incluidas en el esquema OpenAPI.

| Métodos | Ruta | Propósito y respuesta actual | Estado | Recomendación |
| --- | --- | --- | --- | --- |
| GET, HEAD | `/openapi.json` | Publicar el esquema generado mediante `JSONResponse`, sin DTO de negocio. | ✅ Ya serializado | Mantener JSON OpenAPI generado; evitar secretos en ejemplos y descripciones y decidir su exposición en producción. |
| GET, HEAD | `/docs` | Interfaz Swagger UI mediante `HTMLResponse`. | ✅ Ya serializado | HTML deliberado, no ORM ni JSON de negocio; restringir o deshabilitar si la política de despliegue lo exige. |
| GET, HEAD | `/docs/oauth2-redirect` | HTML auxiliar de Swagger para redirecciones OAuth2. | ✅ Ya serializado | Su existencia no demuestra que haya autenticación OAuth2 implementada; conservar solo si se necesita la documentación. |
| GET, HEAD | `/redoc` | Documentación ReDoc mediante `HTMLResponse`. | ✅ Ya serializado | HTML deliberado; aplicar la misma política de exposición que a Swagger. |

El middleware CORS también puede contestar solicitudes preflight `OPTIONS`;
no es un endpoint de negocio ni devuelve un payload ORM. No se localizaron
otras rutas Python, registros dinámicos o aplicaciones FastAPI independientes.

## Verificación y pendientes independientes

Verificado mediante `TestClient` sobre las 11 rutas funcionales, con SQLite
en memoria para inventario y sin modificar la base de datos de trabajo:

- Salud y candidatos conservan sus payloads con modelos de salida específicos.
- Productos, entregas, consumos y órdenes funcionan con DTO de salida separados.
- Los modelos de salida descartan campos adicionales como `password`,
  `password_hash`, `hashed_password` e `internal_token`; las peticiones de
  creación con esos campos no los reflejan en las respuestas.
- Análisis, exportación CSV y errores de archivo vacío, cabecera inválida y
  exportación sin análisis mantienen su comportamiento.
- OpenAPI anuncia únicamente `text/csv` para el éxito de exportación y los
  11 decoradores de ruta declaran explícitamente `response_model`.

No se añadieron archivos de pruebas. La ejecución del archivo de pruebas
existente de incidencias no fue posible porque el entorno no dispone de
`pytest` (`No module named pytest`); sus flujos se comprobaron directamente
con `TestClient`.

Pendientes que no impiden clasificar los contratos de éxito como serializados:

1. Documentar con un esquema común los errores 400/404 de inventario.
2. Antes de usar datos reales o múltiples usuarios, aplicar autorización,
   derivar la identidad en servidor y aislar resultados de análisis.
3. Mantener DTO públicos separados de cualquier futuro modelo de credenciales
   y sanear errores de validación si se introducen secretos como entrada.

Fuentes revisadas:
[aplicación principal](../services/main.py),
[alias de aplicación](../services/api/main.py),
[registro de incidencias](../services/api/api_v1.py),
[router de inventario](../services/routers/inventory.py),
[esquemas de inventario](../services/schemas.py),
[modelos ORM](../services/models.py),
[router de incidencias](../services/api/routers/incidents.py),
[esquemas de incidencias](../services/api/schemas/incidents.py),
[generador de métricas y CSV](../services/api/services/incidents_analysis_service.py)
y [pruebas existentes de incidencias](../services/api/tests/test_incidents_router.py).

La revisión es de código y contratos; no constituye una prueba de penetración
ni una verificación de permisos en un despliegue real.