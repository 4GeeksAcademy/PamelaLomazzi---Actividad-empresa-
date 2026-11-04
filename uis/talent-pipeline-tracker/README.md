This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Inventario (Hito 5)

Configura `.env.local` en esta carpeta antes de iniciar Next.js:

```dotenv
NEXT_PUBLIC_INVENTORY_API_URL=/api/inventory
```

`next.config.ts` fija la URL publica efectiva a `/api/inventory`, con prioridad
sobre `.env.local`, y reenvia las peticiones a `http://127.0.0.1:8000/inventory`.
El navegador usa el mismo origen del frontend, evitando CORS y la autenticacion
del puerto reenviado de Codespaces. La API debe estar en ejecucion en el puerto
8000; inicia desde la raiz con `python -m uvicorn services.main:app --host 0.0.0.0 --port 8000`.
Para otro destino del proxy, configura `INVENTORY_API_URL` (solo servidor),
con o sin el sufijo `/inventory`. No publiques tokens en estas variables.
Reinicia Next.js despues de cambiar las variables.

El modulo comienza en `/backoffice/inventory/products`. Incluye entradas,
salidas e historial de solo lectura. El umbral visual de stock bajo es 10
unidades (provisional, la API no define un minimo por producto).

El cliente `lib/inventory.ts` admite un token opcional; si no se proporciona,
lee `localStorage.token` y envia `Authorization: Bearer <token>` cuando existe.
No hay proveedor de autenticacion ni login implementados. Por ahora el acceso
es directo y el formulario solicita el `user_uuid` responsable, sin inventarlo.
Cuando exista un login, configura `NEXT_PUBLIC_INVENTORY_LOGIN_PATH=/login`
para redirigir las vistas sin token; el login debe almacenar el token y admitir
el parametro `next`. Este guard es provisional y no sustituye la validacion
de tokens y permisos en el backend, que actualmente no exige autenticacion.

El historial utiliza `GET /inventory/orders`, que devuelve ambas clases de
orden con `order_type` (`inbound` o `outbound`) y `product_name`. Las salidas
actualizan el stock al seleccionar el producto y lo verifican de nuevo antes
del envio. El backend conserva la validacion final y sus errores se muestran
en el formulario.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
