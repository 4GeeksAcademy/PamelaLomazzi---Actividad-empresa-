# Carpeta `infra`

Esta carpeta contiene las **configuraciones de infraestructura** para el monorepo (por ejemplo: Dockerfiles, scripts de Terraform, manifiestos de despliegue, configuraciones de Nginx, etc.).

- **Propósito principal**: centralizar la definición de la infraestructura necesaria para ejecutar las aplicaciones y servicios de la compañía.
- **Recomendación**: documenta cómo aprovisionar y desplegar la infraestructura.

## Desarrollo con Docker Compose (infra-40)

Desde la raiz del repositorio:

```bash
docker compose up --build
```

El archivo `.env` raiz existente se conserva y esta ignorado por Git.
La plantilla `.env.example` muestra las variables disponibles; Compose utiliza
esos mismos valores por defecto cuando no se definen. No reemplaces credenciales
existentes. `DATABASE_URL` debe apuntar a una base accesible desde Docker;
`localhost` dentro de un contenedor no es el host ni otro servicio.

- Sitio web: http://localhost:3000 (HTML y recursos de la raiz, sin moverlos).
- Backoffice: http://localhost:3001/backoffice/inventory/products (app existente
	en `uis/talent-pipeline-tracker`, sin renombrarla).
- API: http://localhost:8000/docs (`services.main:app`, incluye inventario).

`uis/website` contiene solo el lanzador Vite del sitio estatico. Las dependencias
de Vite y Next.js se instalan por separado. El contenedor `interfaces` arranca
ambos procesos mediante `uis/start.sh`; si uno termina, se detiene el otro.
Los bind mounts permiten recarga en caliente; las dependencias, la cache de
Next.js y la base SQLite usan volumenes Docker separados. El backend usa
`uv pip install -r requirements.txt` y Uvicorn con `--reload`.

El navegador usa `/api/inventory` en el mismo origen del backoffice. Next.js
reenvia internamente a `http://backend:8000/inventory` mediante la red `healthcore`;
no necesita acceder al puerto externo de la API ni relajar CORS.

El build de interfaces usa la raiz como contexto para incluir los HTML y las
imagenes. Por eso `uis/Dockerfile.dockerignore` aplica una lista permitida y
excluye dependencias, cache y secretos; `uis/.dockerignore` documenta tambien
las exclusiones del directorio. El backend usa `services/.dockerignore`.

Si ya hay servidores locales en estos puertos, detenlos o utiliza otros puertos:

```bash
WEBSITE_PORT=3100 BACKOFFICE_PORT=3101 API_PORT=8100 docker compose up --build
```

En Codespaces, abre los puertos reenviados 3000 y 3001 (o los alternativos).
Para detener los contenedores sin borrar datos: `docker compose down`.
No uses `down -v` salvo que quieras eliminar tambien los volumenes de datos.
