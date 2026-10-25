# Despliegue y ambientes

## Ambientes

| Ambiente   | Rama                                 | Dónde                           | Pagos                      | Base de datos           |
| ---------- | ------------------------------------ | ------------------------------- | -------------------------- | ----------------------- |
| Local      | cualquiera                           | `npm run dev`                   | WhatsApp                   | Neon, rama `dev`        |
| Preview    | `dev`, `qa`, `feature/*`, `fix/*`, … | Vercel Preview (`*.vercel.app`) | WhatsApp                   | Neon, rama `dev`        |
| Production | `main`                               | Vercel Production               | WhatsApp (Wompi en el 4.4) | Neon, rama `production` |

**Estado actual (Paso 6a):** solo hay **previews**. `main` **no se despliega** (`vercel.json` →
`git.deploymentEnabled.main = false`) hasta el lanzamiento (Paso 6b), para que nadie vea una
tienda con datos de ejemplo como si fuera real.

> **Plan de Vercel:** Hobby (gratis) es solo para uso **personal no comercial**. Las previews de
> desarrollo de este proyecto se hacen en la cuenta Hobby del desarrollador porque el trabajo no es
> remunerado. Antes de la primera venta, el proyecto pasa a una cuenta **Pro** del negocio
> (ver [scaling.md](scaling.md)). Fuente: <https://vercel.com/docs/limits/fair-use-guidelines>.

## Configuración en Vercel (una sola vez)

1. Entrar a <https://vercel.com> con **Continue with GitHub**.
2. **Add New… → Project** → importar el repo `melange`. Framework: Next.js (lo detecta solo).
3. No cambiar comandos: `vercel.json` ya define:
   - `buildCommand`: `npm run db:deploy && npm run build` (aplica migraciones pendientes y compila).
   - `regions`: `iad1` (Washington, EE. UU.), junto a Neon `us-east-1`.
4. Antes de **Deploy**, cargar las variables de la tabla de abajo con el ambiente **Preview**
   marcado (y **no** Production por ahora).
5. Deploy. El primer despliegue de `main` se omite (esperado); las previews se crean en cada push
   a `dev`, `qa` y ramas de trabajo, y Vercel comenta el enlace en cada PR.

Las previews tienen **Deployment Protection** (Vercel Authentication) activada por defecto: solo
las ve quien tenga sesión en tu cuenta de Vercel. Así se mantiene.

## Variables por ambiente

Fuente de verdad: `.env.example` y `src/lib/env.ts`. En Vercel: _Project → Settings →
Environment Variables_, marcando el ambiente.

| Variable                      | Local (`.env.local`)     | Preview (Vercel)                                  | Production (6b)             | Secreta |
| ----------------------------- | ------------------------ | ------------------------------------------------- | --------------------------- | ------- |
| `NEXT_PUBLIC_SITE_URL`        | `http://localhost:3000`  | **No definir**: se toma de `VERCEL_BRANCH_URL`    | dominio propio              | No      |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `570000000000` o el tuyo | `570000000000` o el tuyo                          | número del negocio          | No      |
| `PAYMENT_PROVIDER`            | `whatsapp`               | `whatsapp`                                        | `whatsapp` / `wompi`        | No      |
| `EMAIL_PROVIDER`              | `console`                | `console` (los correos salen en _Logs_ de Vercel) | proveedor real (6b)         | No      |
| `DATABASE_URL`                | Neon `dev` (pooled)      | Neon `dev` (pooled)                               | Neon `production` (pooled)  | **Sí**  |
| `DIRECT_URL`                  | Neon `dev` (directa)     | Neon `dev` (directa), la usa `db:deploy`          | Neon `production` (directa) | **Sí**  |
| `BETTER_AUTH_SECRET`          | uno propio               | **otro distinto**                                 | otro distinto               | **Sí**  |
| `ADMIN_EMAILS`                | tu correo                | tu correo                                         | correos de los admins       | No      |

`VERCEL_URL` y `VERCEL_BRANCH_URL` las pone Vercel solo: la app las usa como URL del sitio y
orígenes de confianza para el login cuando `NEXT_PUBLIC_SITE_URL` no está definida.

Las variables de Cloudinary ([issue #15](https://github.com/Nicolas-2307/melange/issues/15)) y
Wompi (Paso 4.4) se añadirán cuando existan las cuentas de la dueña.

## Base de datos (Neon)

- Proyecto `melange` con dos ramas: `production` (la rama por defecto) y `dev` (desarrollo y
  previews).
- `DATABASE_URL` usa el pooler de Neon (host con `-pooler`): la app abre muchas conexiones cortas.
- `DIRECT_URL` es la conexión directa; solo la usa la CLI de Prisma (`prisma migrate`).
- Desarrollo: `npm run db:migrate` crea y aplica migraciones en la rama `dev`.
- Despliegues: `npm run db:deploy` (en el `buildCommand`) aplica migraciones ya versionadas, sin
  crear nuevas. Las previews comparten la rama `dev`: una migración en un PR se aplica a esa base
  al desplegar la preview, igual que al probarla en local.

## Flujo de una funcionalidad

1. `feature/*` → PR a `dev`: CI (lint, typecheck, test, build, e2e) + **preview** de la rama.
2. Merge a `dev` → preview de `dev` (la "versión de integración").
3. PR `dev → qa` (merge commit) → preview de `qa`, la que se revisa antes de lanzar.
4. PR `qa → main` (merge commit) → **producción** (a partir del Paso 6b).

## Traspaso al propietario (antes de la primera venta)

Mientras se desarrolla, las cuentas pueden ser del desarrollador con datos de prueba. Antes de
vender, todo lo que maneja dinero o datos de clientes pasa al negocio (idealmente con un correo
del negocio), y el desarrollador queda como miembro invitado. Como todo se configura con
variables de entorno, el código no cambia.

| Servicio         | Qué hacer                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| GitHub           | Settings → Danger Zone → Transfer ownership; luego `git remote set-url origin <nueva URL>`                   |
| Neon             | Proyecto nuevo en la cuenta del negocio → `npm run db:deploy` → nuevas `DATABASE_URL`/`DIRECT_URL` en Vercel |
| Vercel           | Cuenta o equipo **Pro** del negocio importa el repo y carga las variables por ambiente                       |
| Cloudinary       | Cuenta del negocio **antes** de subir fotos reales (las URLs incluyen el nombre de la cuenta)                |
| Wompi            | Siempre del propietario; solo se cargan sus llaves                                                           |
| WhatsApp         | `NEXT_PUBLIC_WHATSAPP_NUMBER` con el número del negocio                                                      |
| Dominio y correo | A nombre del propietario desde el inicio                                                                     |

Al terminar: nuevo `BETTER_AUTH_SECRET` de producción, regenerar claves que conoció el
desarrollador (Neon, Cloudinary, Wompi) y revisar quién tiene acceso en cada servicio.

## Reglas

- Los secretos reales solo viven en `.env.local` (tu equipo) y en Vercel. Nunca en Git ni en el chat.
- Preview y Production **nunca** comparten base de datos, secretos de sesión ni llaves de pago.
- Las URLs de Neon llevan `sslmode=verify-full` (con `require`, la librería `pg` muestra una advertencia).
- Tras cambiar una variable en Vercel hay que **volver a desplegar** (_Deployments → ⋯ → Redeploy_)
  para que tome efecto.
