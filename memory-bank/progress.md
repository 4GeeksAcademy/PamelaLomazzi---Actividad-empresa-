# Progreso actual

## Completado

- **Optimización de caché:** middleware temporal de medición de duración HTTP; carga diferida de secciones secundarias en Next.js; memoización del índice de búsqueda; caché en memoria con TTL de 15 s para productos y 30 s para órdenes, invalidación tras escrituras y recarga explícita sin caché.
- **Protecciones de caché:** respuestas de inventario con `no-store`; no se almacenan tokens o cookies en crudo; el historial no se cachea sin ámbito privado; las entradas son copias de DTO y la invalidación evita repoblar con una carga anterior. Esta partición no autentica ni autoriza.
- **Seguridad de auditoría documentada:** esquema acotado a `patient_ref` y `action` con campos extra rechazados; respuestas y alertas limitadas a metadatos sin contenido clínico; JWT firmado con claims validados y roles Admin/Supervisor/Empleado; datos de seed sintéticos y alerta básica por ráfaga.
- **Verificación reportada:** pruebas de backend y de caché, ESLint y TypeScript focalizados; limitación conocida de que Chromium no arrancó en el entorno por falta de `libatk-1.0.so.0`.

Estos resultados describen implementaciones y comprobaciones documentadas, no certifican HIPAA o UK GDPR ni prueban seguridad en producción.

## Pendiente / siguientes pasos

1. Integrar la escritura de auditoría en cada operación real de lectura, modificación y exportación clínica antes de habilitar datos reales.
2. Conectar un emisor de identidad confiable y verificar autorización y ámbito de clínica/usuario en servidor; no confiar en IDs suministrados por el cliente. Confirmar configuración de secretos fuera del repositorio.
3. Revisar la retención, acceso, cifrado, ubicación y transferencias internacionales con los responsables de cumplimiento; evaluar por separado cualquier integración futura de Supabase y sus políticas.
4. Probar que todos los caminos de error y logging excluyen PHI y credenciales, usando fixtures sintéticos y comprobaciones automatizadas de allowlist.
5. Medir caché y carga diferida con perfiles representativos de forma segura; validar consistencia si se agregan workers o réplicas y aplicar una estrategia compartida antes de depender de invalidación distribuida.
6. Completar pruebas de navegador en un entorno con dependencias gráficas disponibles y documentar sus límites.

## Riesgos abiertos conocidos

- La invalidación de caché solo es coherente dentro de un proceso; varias réplicas pueden servir datos hasta que expire el TTL.
- La huella privada de caché no es autenticación. La revisión de caché documenta que el backend aún requiere autorización efectiva y ámbito por clínica antes de datos reales.
- El escritor de auditoría debe integrarse en futuras rutas clínicas; el seed de demostración no garantiza cobertura de operaciones.
- La integración de Supabase no está confirmada por los manifiestos inspeccionados.
