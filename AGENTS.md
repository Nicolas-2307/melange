# AGENTS.md — Reglas del proyecto Melange

Fuente única de reglas para cualquier agente de IA (Claude Code, Copilot, Cursor, etc.)
y para personas. Si algo aquí contradice otro archivo, este manda.

## Proyecto

Tienda online de repostería (postres, galletas, pasteles) en Colombia.

- Moneda **COP**, precios como **enteros** (sin decimales, sin `Float`). Formato con `src/lib/format.ts`.
- Idioma de la UI y documentación: **español (es-CO)**. Zona horaria: `America/Bogota`.
- Código, nombres de variables, ramas y commits: **inglés**.

## Stack

Next.js (App Router) + TypeScript estricto · Tailwind CSS · PostgreSQL (Neon) + Prisma ·
Better Auth · Cloudinary · Wompi + WhatsApp · Zod · Vitest + Playwright · Vercel · npm.

## Estructura

- `src/app/(shop)` tienda · `src/app/(auth)` login/registro · `src/app/admin` panel (rol ADMIN) · `src/app/api` webhooks/endpoints.
- `src/components/ui` componentes genéricos · `src/components/layout` header/footer.
- `src/features/<dominio>` lógica de negocio (catalog, cart, checkout, orders, auth).
- `src/services/<tipo>` proveedores externos detrás de interfaces propias
  (`PaymentProvider`, `StorageProvider`, `EmailProvider`). **Nunca** importes el SDK de un
  proveedor fuera de su carpeta de servicio; el proveedor activo se elige por variable de entorno.
- `src/app/legal` páginas legales (plantillas) · `src/app/api/auth` Better Auth.
- `src/lib` utilidades transversales (`env.ts`, `db.ts`, `format.ts`, `rate-limit.ts`,
  `business.ts` con los datos legales del negocio).
- `tests/unit` (Vitest) · `tests/e2e` (Playwright) · `docs/` documentación y ADRs.
- **`docs/progress.md`**: estado del plan, decisiones y siguiente paso. Léelo al empezar una
  sesión y actualízalo al cerrar cada paso.

## Comandos

| Comando              | Qué hace                                        |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo en http://localhost:3000 |
| `npm run lint`       | ESLint (0 advertencias permitidas)              |
| `npm run typecheck`  | Tipos de rutas + `tsc --noEmit`                 |
| `npm test`           | Pruebas unitarias (Vitest)                      |
| `npm run test:e2e`   | Pruebas e2e (Playwright)                        |
| `npm run db:migrate` | Crea y aplica una migración (desarrollo)        |
| `npm run db:deploy`  | Aplica migraciones pendientes (producción)      |
| `npm run db:seed`    | Carga productos de ejemplo                      |
| `npm run db:studio`  | Explorador visual de la base de datos           |
| `npm run build`      | Build de producción                             |
| `npm run format`     | Prettier en todo el repo                        |

Antes de dar una tarea por terminada: `npm run lint && npm run typecheck && npm test && npm run build`.

## Convenciones

- TypeScript estricto: sin `any`, sin `@ts-ignore` sin justificación.
- Validar con Zod toda entrada externa (formularios, query params, webhooks, variables de entorno).
- Variables de entorno: solo a través de `env` de `src/lib/env.ts`, nunca `process.env` directo.
  Cada variable nueva va en `env.ts`, `.env.example` y `docs/deployment.md`.
- Server Components por defecto; `"use client"` solo cuando haga falta interactividad.
- Montos siempre en enteros COP; nunca calcular precios en el cliente sin revalidar en el servidor.
- Lecturas del catálogo en `src/features/catalog/queries.ts` (cacheadas). Toda escritura de
  productos/categorías llama `updateTag(CATALOG_TAG)`.
- **Cache Components (Next 16):** todo lo que dependa del visitante (sesión, cookies,
  `searchParams`) va dentro de `<Suspense>`; si usa la fecha u hora actual, llama antes
  `connection()`. Las páginas del panel siguen el patrón página síncrona +
  `<Suspense fallback={<AdminSkeleton />}>` + componente async.
- **Autorización:** `requireAdmin()` en **cada** página y server action del panel (no basta el
  layout ni `proxy.ts`); `requireUser(next)` en páginas de cliente con cuenta.
- Después de ingresar, registrarse o salir, navegar con recarga completa
  (`window.location.assign`), para que todo el árbol vea la nueva sesión.
- Acciones públicas que crean registros (pedidos, carritos…) llevan límite de intentos con
  `consumeRateLimit` (`src/lib/rate-limit.ts`, activo en producción).
- Donde se recolecten datos personales, casilla obligatoria `PrivacyConsent` y guardar la
  prueba de la autorización (Ley 1581 de 2012).
- Tras cambiar `prisma/schema.prisma`: migración (`npm run db:migrate`, o `migrate diff` +
  `db:deploy` si pide confirmación interactiva) y `npx prisma generate`.

## Pruebas e2e

- Correos de prueba siempre en `@e2e.melange.test`; cada archivo borra en `afterAll` **solo**
  lo que creó (las pruebas corren en paralelo contra la rama `dev` de Neon).
- Cada prueba usa una IP propia (`x-forwarded-for` aleatoria) por los límites de intentos.
- Tras navegar del lado del cliente, Next mantiene oculta la página anterior: usar
  `.filter({ visible: true })` o esperar la URL nueva antes de hacer clic.
- No cambiar configuración global ni bloquear fechas cercanas (otras pruebas las usan); si una
  prueba bloquea un día, que sea lejano (45 días o más).

## Datos de la propietaria

La dueña del negocio aún no ha entregado sus datos ni sus cuentas. Todo lo que dependa de ella
(número de WhatsApp, cuentas, precios, fotos, zonas, datos legales…) usa **valores de ejemplo**
configurables y nunca bloquea el trabajo. Si un cambio agrega o quita algo que ella debe
entregar, **actualiza `docs/datos-pendientes-propietaria.md` en el mismo PR**.

## Flujo de Git

- Ramas largas: `dev` → `qa` → `main` (producción). Ver `docs/git-workflow.md`.
- Trabajo en `feature/*`, `fix/*`, `chore/*` creadas **desde `dev`**; PR hacia `dev`.
- Commits con **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`…),
  validados por commitlint.
- Nunca hacer push directo ni force-push a `main` o `qa`. Nunca usar `--no-verify`.
- Ramas de trabajo con nombres `feature/*`, `fix/*` o `chore/*` (no `docs/*`).
- Los PRs se unen **solo con todos los checks en verde**: _squash_ hacia `dev` (borrando la
  rama de trabajo) y _merge commit_ en las promociones `dev → qa → main`. La promoción a `main`
  publica la tienda: requiere confirmación explícita del desarrollador.
- Nunca borrar `dev`, `qa` ni `main`.

## Seguridad (obligatorio)

- **Nunca leer ni escribir secretos reales.** No abrir `.env`, `.env.local` ni `.env.*.local`;
  solo `.env.example`, que contiene marcadores sin valores reales.
- No pedir claves en el chat ni incluirlas en código, logs, commits, issues o PRs.
- Si detectas un secreto expuesto, detente y avisa.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
