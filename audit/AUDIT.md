# Auditoría de Rendimiento Frontend

## Objetivo

Medir el rendimiento inicial de los frontends corporativo y backoffice, registrar oportunidades de mejora y comparar las mediciones posteriores sin mezclar cambios de entorno.

## Alcance

- Sitio corporativo: `uis/website` (Vite; la entrada HTML está en la raíz del repositorio).
- Backoffice: `uis/talent-pipeline-tracker` (Next.js).
- No se modificarán funcionalidades durante la captura de la línea base.

## Build y ejecución de producción

Ejecutar desde el directorio indicado.

| Frontend | Build | Ejecución/serving | Estado actual |
| --- | --- | --- | --- |
| Sitio corporativo | `cd uis/website && npx vite build` | Servir el directorio `dist/` con un servidor HTTP estático de producción. `npx vite preview --host 0.0.0.0` sirve para validar localmente el build, no como servidor de producción. | `package.json` solo declara `dev`; no existen scripts `build` ni `start`. |
| Backoffice | `cd uis/talent-pipeline-tracker && npm run build` | `cd uis/talent-pipeline-tracker && npm run start` (`next start`) | Ambos scripts están declarados en `package.json`. |

Antes de medir, anotar el servidor elegido, configuración de producción, URL, navegador y versión, dispositivo/perfil de red, commit y variables de entorno relevantes. Mantenerlos iguales en las capturas `before` y `after`.

## Protocolo de medición

1. Construir cada frontend en modo producción y confirmar que se carga desde su servidor de producción/estático.
2. Elegir y anotar páginas y recorridos representativos, incluyendo estados iniciales y contenido cargado desde API.
3. Medir cada recorrido al menos tres veces con la misma herramienta y condiciones; registrar cada resultado y la mediana.
4. Guardar reportes y capturas sin sobrescribirlos: línea base en `audit/before/`, comparación en `audit/after/`.
5. Registrar cualquier diferencia de datos, caché, red o entorno que pueda sesgar los resultados.

## Métricas

| Métrica | Before | After | Fuente / observaciones |
| --- | --- | --- | --- |
| LCP | Pendiente | Pendiente | |
| INP | Pendiente | Pendiente | |
| CLS | Pendiente | Pendiente | |
| FCP | Pendiente | Pendiente | |
| TTFB | Pendiente | Pendiente | |
| JS transferido | Pendiente | Pendiente | |
| Peso total transferido | Pendiente | Pendiente | |

## Puntuaciones Lighthouse (fase inicial)

| Frontend | Dispositivo | Categoría | Before | After |
| --- | --- | --- | ---: | ---: |
| Sitio corporativo | Móvil | Performance | 67 | Pendiente |
| Sitio corporativo | Móvil | Accessibility | 91 | Pendiente |
| Sitio corporativo | Móvil | Best Practices | 73 | Pendiente |
| Sitio corporativo | Móvil | SEO | 58 | Pendiente |
| Backoffice | Móvil | Performance | 50 | Pendiente |
| Backoffice | Móvil | Accessibility | 100 | Pendiente |
| Backoffice | Móvil | Best Practices | 100 | Pendiente |
| Backoffice | Móvil | SEO | 58 | Pendiente |
| Backoffice | Escritorio | Performance | 95 | Pendiente |
| Backoffice | Escritorio | Accessibility | 100 | Pendiente |
| Backoffice | Escritorio | Best Practices | 100 | Pendiente |
| Backoffice | Escritorio | SEO | 63 | Pendiente |

## Candidatos de refactor para evaluar

- **Carga de candidaturas:** listado, detalle y edición gestionan en el cliente estados de carga/error y solicitudes con `useEffect`. Evaluar un Custom Hook compartido para la carga por ID/lista, manteniendo el tratamiento de notas del detalle y los mensajes específicos de cada pantalla.
- **Cabecera del backoffice:** las páginas de pipeline y edición repiten estructura, logo, título y estilos de encabezado. Evaluar un componente reutilizable de cabecera.
- **Límite entre frontends:** el sitio corporativo es Vite/HTML y el backoffice es Next/React; no asumir que extraer componentes entre ambos reducirá el bundle. Medir cada aplicación por separado.

Estos son candidatos basados en inspección estática, no cambios aprobados ni mejoras de rendimiento demostradas. Para cada uno, registrar coste de implementación, riesgo y efecto medido antes de conservarlo.

## Registro de cambios

| Cambio | Frontend/página | Hipótesis | Resultado medido | Decisión |
| --- | --- | --- | --- | --- |
| Pendiente | | | | |