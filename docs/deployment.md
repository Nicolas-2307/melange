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

| Variable                      | Development               | Preview                  | Production                                 | Secreta |
| ----------------------------- | ------------------------- | ------------------------ | ------------------------------------------ | ------- |
| `NEXT_PUBLIC_SITE_URL`        | `http://localhost:3000`   | URL del preview          | dominio propio                             | No      |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | número de prueba          | número de prueba         | número del negocio                         | No      |
| `PAYMENT_PROVIDER`            | `whatsapp` / `wompi`      | `wompi`                  | `wompi`                                    | No      |
| `STORAGE_PROVIDER`            | `cloudinary`              | `cloudinary`             | `cloudinary`                               | No      |
| `EMAIL_PROVIDER`              | `console`                 | `console`                | _(Etapa 2)_                                | No      |
| `DATABASE_URL`                | Neon rama `dev` (pooled)  | Neon rama `dev` (pooled) | Neon rama `production` (pooled)            | **Sí**  |
| `DIRECT_URL`                  | Neon rama `dev` (directa) | —                        | Solo si se migra desde Vercel              | **Sí**  |
| `BETTER_AUTH_SECRET`          | uno propio                | otro distinto            | otro distinto                              | **Sí**  |
| `ADMIN_EMAILS`                | tu correo                 | tu correo                | correos de los admins, separados por comas | No      |

Las variables de Cloudinary y Wompi se añadirán aquí en los pasos 4 y 5.

## Base de datos (Neon)

- Proyecto `melange` con dos ramas: `production` (producción, la rama por defecto) y `dev` (desarrollo y previews).
- `DATABASE_URL` usa el pooler de Neon (host con `-pooler`): la app abre muchas conexiones cortas.
- `DIRECT_URL` es la conexión directa; solo la usa la CLI de Prisma (`prisma migrate`).
- Desarrollo: `npm run db:migrate` crea y aplica migraciones en la rama `dev`.
- Producción: `npm run db:deploy` aplica las migraciones ya versionadas, sin crear nuevas.

## Traspaso al propietario (antes de la primera venta)

Mientras se desarrolla, las cuentas pueden ser del desarrollador con datos de prueba. Antes de
vender, todo lo que maneja dinero o datos de clientes pasa al negocio (idealmente con un correo
del negocio), y el desarrollador queda como miembro invitado. Como todo se configura con
variables de entorno, el código no cambia.

| Servicio         | Qué hacer                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| GitHub           | Settings → Danger Zone → Transfer ownership; luego `git remote set-url origin <nueva URL>`                   |
| Neon             | Proyecto nuevo en la cuenta del negocio → `npm run db:deploy` → nuevas `DATABASE_URL`/`DIRECT_URL` en Vercel |
| Vercel           | Cuenta o equipo del negocio importa el repo y carga las variables por ambiente                               |
| Cloudinary       | Cuenta del negocio **antes** de subir fotos reales (las URLs incluyen el nombre de la cuenta)                |
| Wompi            | Siempre del propietario; solo se cargan sus llaves                                                           |
| WhatsApp         | `NEXT_PUBLIC_WHATSAPP_NUMBER` con el número del negocio                                                      |
| Dominio y correo | A nombre del propietario desde el inicio                                                                     |

Al terminar: nuevo `BETTER_AUTH_SECRET` de producción, regenerar claves que conoció el
desarrollador (Neon, Cloudinary, Wompi) y revisar quién tiene acceso en cada servicio.

## Reglas

- Los secretos reales solo viven en `.env.local` (tu equipo) y en Vercel. Nunca en Git.
- Preview y Production **nunca** comparten llaves de Wompi ni base de datos.
- Las URLs de Neon llevan `sslmode=verify-full` (con `require`, la librería `pg` muestra una advertencia).
- Tras cambiar una variable en Vercel hay que **volver a desplegar** para que tome efecto.

> Se completa en el Paso 6 (Vercel).
