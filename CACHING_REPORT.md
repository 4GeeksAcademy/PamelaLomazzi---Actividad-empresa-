# Optimización de rendimiento: Caching

Fecha: 2026-11-10. Estado final: implementados el middleware temporal de timing,
dos componentes con carga diferida, la memoización del índice de búsqueda y
caché en memoria con TTL e invalidación para los dos endpoints elegidos.
No se dispone de perfiles de producción ni de un benchmark de bundle que
cuantifique la mejora: no se atribuyen porcentajes de ahorro no medidos.

## Medición temporal de latencias

Implementación en [services/main.py](services/main.py): middleware HTTP con
`perf_counter()` y cabecera `X-Process-Time-Ms`, expresada en milisegundos con
tres decimales. No altera el cuerpo ni el código de respuesta y no registra
credenciales, cuerpos o parámetros. La cabecera está expuesta mediante CORS
para poder consultarla desde el navegador.

- Activado por defecto; `API_TIMING_ENABLED=false` lo desactiva al reiniciar
  el backend. `true`, `1` y `yes` lo activan.
- Verificado con `TestClient` en `/health`, `/records`, un error 422 de
  inventario y un 404, incluida la exposición CORS y la desactivación.
- Mide desde la entrada en este middleware hasta que `call_next` obtiene la
  respuesta; incluye el trabajo previo de dependencias, consultas y construcción
  de la respuesta. No equivale al tiempo de red ni a la latencia del navegador.
- En streaming no mide la transferencia completa del cuerpo. Si una excepción
  no controlada escapa de `call_next`, no se añade esta cabecera; tampoco es
  una medición completa de todas las respuestas 500.
- Es instrumentación temporal: retirar el middleware y la exposición de la
  cabecera al finalizar la comparación, o desactivarlo por configuración.

Para evaluar el efecto de la caché: medir GET de productos y órdenes con un volumen
representativo, concurrencia fija y varias ejecuciones, separando calentamiento.
Comparar p50/p95, consultas SQL, tamaño de respuesta y carga de CPU. Después,
separar hits y misses y medir tasa de aciertos, invalidaciones y errores.
Los tiempos locales de `TestClient` verifican la instrumentación, pero no son
una línea base representativa ni prueban una mejora de rendimiento.

## Decisiones en el frontend

Se revisó Next.js 16.2.10 / React 19.2.4 y su guía instalada de lazy loading.
No hay bibliotecas pesadas de gráficos o editores en las dependencias actuales.
Se separaron dos secciones por tamaño funcional y momento de uso, sin modificar
la presentación existente ni envolver páginas completas ya divididas por Next.

### Lazy Loading: resultados de incidencias

Fuente: [app/incidents/page.tsx](uis/talent-pipeline-tracker/app/incidents/page.tsx),
bloque condicionado por `result`, con resumen, incidencias inválidas y dos tablas.

- Extraído a [incident-results.tsx](uis/talent-pipeline-tracker/app/incidents/_components/incident-results.tsx).
  `next/dynamic` se declara a nivel de módulo con una importación literal.
- Solo se monta cuando existe `result`. La carga del CSV, las validaciones,
  el análisis y la descarga permanecen en la página inicial.
- El resumen, la alerta y las tablas pertenecen ahora al módulo diferido.
  Sus tres ordenaciones memoizadas se trasladaron con dependencias específicas
  de cada objeto de conteos.
- Se conserva SSR por defecto. Un placeholder con altura mínima y `role=status`
  reserva espacio mientras se descarga el módulo. No se añadió precarga ni
  un manejador de errores de descarga específico; quedan como mejoras si se necesitan.

### Lazy Loading: panel de notas de candidatos

Fuente: [app/candidates/[id]/page.tsx](uis/talent-pipeline-tracker/app/candidates/%5Bid%5D/page.tsx),
sección de notas posterior a los datos del candidato y controles rápidos.
Incluye formulario, errores, listado, borrado y formateo de fechas por nota.

- Extraído a [candidate-notes.tsx](uis/talent-pipeline-tracker/app/candidates/_components/candidate-notes.tsx),
  cargado con `next/dynamic`. `DeferredCandidateNotes` lo monta al acercarse
  a 200 px del viewport mediante `IntersectionObserver`.
- Existe un botón accesible para cargarlo manualmente. Sin soporte para el
  observador se monta en el siguiente frame. El observador se desconecta al
  activarse o desmontarse; el panel no se desmonta al alejarse del viewport.
- Se conserva el estado de borrador, altas, borrados y actualización del contador
  en la página padre. Los datos principales y controles no se difieren.
- Las peticiones de candidato y notas siguen juntas en `Promise.all`: se difiere
  la presentación, no la descarga de datos ni los handlers de escritura.
- El FastAPI auditado sigue sin implementar detalle ni notas de candidatos.
  No se inventaron rutas para completar esa funcionalidad; su prueba integral
  requiere el proveedor real de datos o simulaciones de navegador.

No envolver una página entera que se renderiza inmediatamente en `dynamic`
como sustituto de estas fronteras: Next ya divide por rutas y una importación
dinámica montada desde el principio no garantiza una descarga diferida hasta
la interacción. Verificar bytes iniciales y chunks en una compilación de
producción, y perfiles React con volúmenes representativos. Si el ahorro es
menor que el coste de otra petición, conservar la importación estática.

### Cálculo no trivial para useMemo

Fuente: [app/page.tsx](uis/talent-pipeline-tracker/app/page.tsx), `filteredRecords`.
Combina filtrado por estado y etapa con búsqueda por nombre y correo, incluyendo
normalización de cadenas para cada candidato. Recorre todos los registros por
cambio de búsqueda; su coste crece con el número y longitud de los textos.

Implementado `searchableRecords` con `useMemo([records])`: conserva cada registro
y precomputa `normalizedName` y `normalizedEmail` una sola vez por actualización
de la lista. `filteredRecords` usa ese índice con dependencias
`[searchableRecords, selectedStage, selectedStatus, search]` y devuelve los
registros originales, sin modificar datos ni el contrato de presentación.

La búsqueda sigue eliminando espacios laterales e ignorando mayúsculas; no se
fusionaron nombre y correo, para no introducir coincidencias nuevas entre campos.
Cada búsqueda sigue siendo lineal, pero evita normalizar todos los textos por
tecla. Se consume memoria adicional y deben actualizarse los registros de forma
inmutable. Con cuatro candidatos demo no es un cuello de botella demostrado.

También existen tres `useMemo` para ordenar métricas con `toRows` en incidencias.
No añadir otros para sus contadores pequeños sin un perfil que lo justifique.
La configuración revisada no activa `reactCompiler`; si se activa más adelante,
reevaluar la necesidad de memoización manual. Ningún `useMemo` sirve como caché
persistente, entre usuarios o entre solicitudes.

## Decisiones en el backend

Fuente de consultas y escrituras:
[services/routers/inventory.py](services/routers/inventory.py).
Las frecuencias siguientes son hipótesis de uso fundamentadas en los clientes,
no métricas de tráfico: hoy no hay polling periódico en estas pantallas.

| Endpoint implementado | Coste evitado en un hit y frecuencia prevista | TTL y ámbito de almacenamiento | Invalidación tras escrituras |
| --- | --- | --- | --- |
| `GET /inventory/products` | Dos agregaciones `SUM/GROUP BY` y una consulta de productos ordenados, más la construcción de DTO. Se consulta al montar consumidores de `useProducts` y al recargar. | **15 s** absolutos. Solo campos de producto y stock, sin datos de sesión o personales. Una clave por motor de BD y ámbito de credenciales; sin `Authorization` se reutiliza el catálogo común actual. | Tras cada commit satisfactorio de creación de producto, entrega o consumo se limpian ambas cachés del proceso. No se invalida por errores de validación o escrituras rechazadas. |
| `GET /inventory/orders` | Dos consultas con JOIN, construcción del historial completo y ordenación O(M log M). Se consulta al abrir el historial y al actualizarlo. | **30 s** absolutos. Contiene `user_uuid`, clínica y proveedor: solo se cachea bajo una huella privada de `Authorization` y cookies. Sin `Authorization`, incluidas peticiones con solo cookies, se consulta la BD y no se almacena el resultado. | Se limpia conservadoramente tras los mismos tres commits, para todos los ámbitos de este proceso. |

El detalle `GET /inventory/products/{supply_id}` no se cacheó en esta entrega;
continúa consultando la base de datos. Limitar sus agregados al producto
solicitado sería una mejora independiente de optimización SQL.
Los TTL son puntos de partida, no SLA acordados; reducirlos o descartar caché
si la operativa necesita visibilidad estrictamente inmediata entre usuarios.

### Estrategia implementada

Implementación acotada en [services/cache.py](services/cache.py) y el router.

- Cache-aside con dos instancias de `TTLCache`, reloj monotónico y hasta 128
  entradas por instancia. La expiración se comprueba y limpia al acceder;
  los hits no extienden el TTL. Al alcanzar el límite se elimina la entrada
  más antigua por inserción. No hay dependencias nuevas en el backend.
- Se guardan únicamente listas de DTO de respuesta, nunca ORM, sesiones de BD,
  peticiones, cabeceras, contraseñas o respuestas HTTP. Copias profundas al
  almacenar y leer impiden que un consumidor modifique el valor cacheado.
- Las claves incluyen el motor de BD y, cuando hay `Authorization`, HMAC-SHA256
  de las credenciales y cookies con una clave aleatoria de proceso. Nunca se
  guardan tokens ni cookies en crudo como claves. El historial privado no tiene
  entrada anónima compartida; una cookie arbitraria no habilita su caché.
- Esta huella es partición, **no autenticación**: el backend sigue sin validar
  tokens ni filtrar por clínica. No se amplían los permisos existentes. Antes
  de usar datos reales se requiere autenticación y ámbito autorizado en servidor;
  no se debe aceptar `user_uuid` como identidad o mecanismo de aislamiento.
- Un `Lock` protege las entradas y la revisión, pero no mantiene bloqueado el
  proceso durante SQL. Cada limpieza incrementa una revisión; un miss iniciado
  antes de una invalidación no puede repoblar la caché tras ella. La respuesta
  de esa petición ya en curso puede seguir reflejando su lectura anterior.
- `_invalidate_inventory_cache()` se llama inmediatamente después de `commit()`
  en los tres POST actuales, antes del refresco ORM y la respuesta al cliente.
  No existen PUT/PATCH/DELETE de inventario en este backend: no se inventaron.
  Cualquier futura escritura de estos datos debe llamar al mismo invalidante
  tras su commit, incluidas ediciones de nombre y borrados.
- Los botones de recarga envían `X-Inventory-Refresh: true`: consulta directa,
  sin leer ni escribir la caché de esa petición. No invalida otros lectores ni
  renueva su TTL. El resto de peticiones del cliente conserva `cache: no-store`
  para HTTP; sus cabeceras normales no desactivan la caché interna de FastAPI.
- Ambas respuestas GET declaran `Cache-Control: no-store` para no introducir
  almacenamiento HTTP compartido del inventario. El middleware sigue generando
  timing por solicitud, incluidos los hits.

## Intercambios reconocidos (frescura vs. rendimiento)

- La invalidación es coherente solo dentro de un proceso. Esta implementación
  está destinada al ejercicio con un worker: varios workers o réplicas pueden
  conservar sus valores hasta 15/30 s después de una escritura en otro proceso.
  Para coherencia distribuida hacen falta eventos o un almacén compartido;
  Redis y outbox no están implementados. Los reinicios vacían la caché.
- Quince segundos priorizan frescura del stock; treinta segundos aceptan más
  demora del historial a cambio de amortizar joins y ordenación. Con tráfico
  bajo o un inventario pequeño, las copias profundas y el mantenimiento de
  entradas pueden costar más que consultar directamente. Medir bajo carga real.
- Una revisión común simplifica coherencia, pero invalida más claves y reduce
  la tasa de aciertos en periodos de muchas escrituras. La invalidación por
  producto es más precisa, a costa de mayor complejidad.
- La caché no reduce el tamaño de una lista ni el DOM de una tabla: productos
  e historial completos seguirán necesitando paginación si crecen.
- El límite de 128 entradas acota claves, no bytes: listas muy grandes aún
  pueden consumir mucha memoria. Los misses concurrentes pueden duplicar SQL;
  no se implementó single-flight ni limitación de frecuencia de la recarga manual.
  Las escrituras externas a la API no invalidan: su frescura depende del TTL.
- Lazy loading reduce trabajo inicial a cambio de una posible espera al primer
  uso. Memoizar evita recomputaciones a cambio de memoria y disciplina de
  dependencias; no acelera el primer cálculo ni todas las búsquedas.
- No se ha habilitado caché HTTP pública o de CDN para inventario. Sus peticiones
  pueden llevar `Authorization`; mantener los datos operativos fuera de una
  caché compartida sin una política explícita de permisos y aislamiento.

## Qué no se cacheó y por qué

Se implementó únicamente la caché de las dos lecturas indicadas, con las
restricciones anteriores. Se excluyeron expresamente estos otros casos:

| Endpoint, cálculo o componente | Motivo para no cachear o diferir |
| --- | --- |
| `GET /api/incidents/results/export` | Depende de `_last_result`, global por proceso, sin usuario ni identificador de análisis. Una caché por URL puede servir resultados ajenos u obsoletos y agravar un problema de aislamiento existente. Primero usar análisis identificados y autorizados; no cachear el objeto de streaming. |
| `POST /api/incidents/analyze` | Procesa un archivo y actualiza `_last_result`; servir un hit omitiría ese efecto. Una futura deduplicación exige hash del contenido, versión del algoritmo, límites y alcance autorizado; no basta con cachear la ruta o el nombre del archivo. |
| `POST /inventory/products`, `/inventory/deliveries`, `/inventory/consumptions` | Son escrituras, no lecturas reutilizables. Un hit podría omitir una operación. La idempotencia, si se necesita, es otro contrato. |
| `_current_stock` durante `POST /inventory/consumptions` | La decisión de permitir una salida debe consultar datos autoritativos, no el stock de una respuesta GET cacheada. La prevención de consumos concurrentes requiere además garantías transaccionales; el TTL no evita sobreconsumos. |
| `GET /health` y `/` | Respuestas mínimas, sin consultas; la caché aporta poco. En salud puede ocultar un fallo y romper el sentido de una comprobación en vivo. |
| `GET /records` | Solo cuatro registros demo en memoria; no hay coste de base de datos que amortizar y los datos reales serían personales. No añadir una caché compartida anticipando un backend que todavía no existe. |
| `GET /inventory/orders` sin `Authorization` | No hay un ámbito privado identificable. Se conserva la respuesta actual, pero se omite completamente el almacenamiento en caché, aunque la petición incluya cookies. |
| `GET /inventory/products/{supply_id}` | Fuera de las dos lecturas elegidas; sigue consultando datos actuales de la BD. |
| Cabecera, navegación y datos principales del candidato | Son necesarios para la primera vista; diferirlos introduce una espera en el contenido principal. Mantener el lazy loading en secciones secundarias. |

## Verificación final

- `PYTHONDONTWRITEBYTECODE=1 python -m pytest services -q`: **8 pruebas superadas**.
  Única advertencia: deprecación de `httpx` en `TestClient`.
- Comprobaciones focalizadas con `TestClient` y SQLite en memoria: hits con
  cero SELECT, expiración 15/30 s con reloj simulado, invalidación tras los tres
  POST, stock actualizado, rechazo de consumo excesivo sin invalidar, aislamiento
  por credenciales y omisión de caché anónima. No se tocó la BD real.
- Comprobación de copias defensivas y de invalidación durante una carga
  concurrente; recarga explícita y cabeceras normales del navegador verificadas.
- ESLint sobre los archivos de frontend modificados y `npx tsc --noEmit`:
  correctos. Se corrigió localmente una colisión previa entre el tipo de
  candidato `Record` y el tipo genérico estándar mediante el alias `CandidateRecord`.
- Next.js sirve con HTTP 200 y compila `/`, `/incidents`, `/candidates/demo`
  y `/backoffice/inventory/orders` en la vista previa `http://localhost:3001`.
- La verificación interactiva de escritorio/móvil con Playwright quedó
  **bloqueada**: Chromium no arranca por falta de `libatk-1.0.so.0` en el contenedor.
  No se generaron capturas ni se da por verificada la interacción, el tamaño
  real de los chunks o la persistencia del borrador en un navegador.
- No se añadieron archivos de pruebas ni dependencias de proyecto; Playwright
  se descargó temporalmente para intentar la comprobación de navegador.