# Despliegue y ambientes

## Ambientes

| Ambiente   | Rama                     | Dónde             | Pagos                    | Base de datos                |
| ---------- | ------------------------ | ----------------- | ------------------------ | ---------------------------- |
| Local      | cualquiera               | `npm run dev`     | Wompi sandbox / WhatsApp | Neon (rama de desarrollo)    |
| Preview    | `dev`, `qa`, `feature/*` | Vercel Preview    | Wompi sandbox            | Neon (rama de desarrollo/QA) |
| Production | `main`                   | Vercel Production | Wompi producción         | Neon (rama `production`)     |

## Variables por ambiente

Fuente de verdad: `.env.example` y `src/lib/env.ts`. En Vercel: _Project → Settings →
Environment Variables_, marcando el ambiente (Development / Preview / Production).

| Variable                      | Development               | Preview                  | Production                      | Secreta |
| ----------------------------- | ------------------------- | ------------------------ | ------------------------------- | ------- |
| `NEXT_PUBLIC_SITE_URL`        | `http://localhost:3000`   | URL del preview          | dominio propio                  | No      |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | número de prueba          | número de prueba         | número del negocio              | No      |
| `PAYMENT_PROVIDER`            | `whatsapp` / `wompi`      | `wompi`                  | `wompi`                         | No      |
| `STORAGE_PROVIDER`            | `cloudinary`              | `cloudinary`             | `cloudinary`                    | No      |
| `EMAIL_PROVIDER`              | `console`                 | `console`                | _(Etapa 2)_                     | No      |
| `DATABASE_URL`                | Neon rama `dev` (pooled)  | Neon rama `dev` (pooled) | Neon rama `production` (pooled) | **Sí**  |
| `DIRECT_URL`                  | Neon rama `dev` (directa) | —                        | Solo si se migra desde Vercel   | **Sí**  |

Las variables de Auth.js, Cloudinary y Wompi se añadirán aquí en los pasos 3 a 5.

## Base de datos (Neon)

- Proyecto `melange` con dos ramas: `production` (producción, la rama por defecto) y `dev` (desarrollo y previews).
- `DATABASE_URL` usa el pooler de Neon (host con `-pooler`): la app abre muchas conexiones cortas.
- `DIRECT_URL` es la conexión directa; solo la usa la CLI de Prisma (`prisma migrate`).
- Desarrollo: `npm run db:migrate` crea y aplica migraciones en la rama `dev`.
- Producción: `npm run db:deploy` aplica las migraciones ya versionadas, sin crear nuevas.

## Reglas

- Los secretos reales solo viven en `.env.local` (tu equipo) y en Vercel. Nunca en Git.
- Preview y Production **nunca** comparten llaves de Wompi ni base de datos.
- Tras cambiar una variable en Vercel hay que **volver a desplegar** para que tome efecto.

> Se completa en el Paso 6 (Vercel).
