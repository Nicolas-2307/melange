# Melange

Tienda online de repostería —postres, galletas y pasteles— en Colombia. Catálogo con fotos,
carrito, pago con **Wompi** o pedido por **WhatsApp**, y un panel para que el dueño gestione
productos y pedidos.

> Estado: en construcción (Paso 1 de 6 — Fundación).

## Stack

| Área          | Tecnología                                       |
| ------------- | ------------------------------------------------ |
| App           | Next.js (App Router) + TypeScript estricto       |
| Estilos       | Tailwind CSS                                     |
| Base de datos | PostgreSQL en Neon + Prisma                      |
| Autenticación | Better Auth                                      |
| Imágenes      | Cloudinary                                       |
| Pagos         | Wompi + pedido por WhatsApp                      |
| Validación    | Zod                                              |
| Calidad       | ESLint, Prettier, Husky, lint-staged, commitlint |
| Pruebas       | Vitest (unitarias) + Playwright (e2e)            |
| Hosting       | Vercel                                           |

Decisiones detalladas en [`docs/adr/`](docs/adr/).

## Requisitos

- **Node.js 24.22.1** (ver `.nvmrc`) y **npm 11+**. `npm install` falla con otra versión
  mayor de Node (`engine-strict`).
- Git 2.4x+ y, opcionalmente, GitHub CLI (`gh`).
- VS Code con las extensiones recomendadas (el editor las sugiere al abrir el proyecto).

## Instalación

**Windows (PowerShell)**

```powershell
git clone https://github.com/Nicolas-2307/melange.git
cd melange
npm install
Copy-Item .env.example .env.local
npx playwright install chromium
npm run dev
```

**macOS / Linux (bash/zsh)**

```bash
git clone https://github.com/Nicolas-2307/melange.git
cd melange
npm install
cp .env.example .env.local
npx playwright install chromium
npm run dev
```

Abre http://localhost:3000. Si usas `nvm` (macOS/Linux) o `nvm-windows`, ejecuta `nvm use`
(en Windows: `nvm use 24.22.1`) antes de `npm install`.

## Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). Cópialo a `.env.local` y pega tus
valores reales **solo ahí** (`.env.local` nunca se sube a Git). `src/lib/env.ts` las valida con
Zod al arrancar: si falta alguna, la app no inicia y te dice cuál. Variables por ambiente en
[`docs/deployment.md`](docs/deployment.md).

## Scripts

| Script                            | Descripción                                    |
| --------------------------------- | ---------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo                         |
| `npm run build`                   | Build de producción                            |
| `npm start`                       | Sirve el build de producción                   |
| `npm run lint` / `lint:fix`       | ESLint (sin advertencias) / con autocorrección |
| `npm run format` / `format:check` | Prettier: formatear / verificar                |
| `npm run typecheck`               | Verificación de tipos                          |
| `npm test` / `test:watch`         | Pruebas unitarias (Vitest)                     |
| `npm run test:e2e`                | Pruebas e2e (Playwright)                       |
| `npm run db:migrate`              | Crea y aplica una migración (desarrollo)       |
| `npm run db:deploy`               | Aplica migraciones pendientes (producción)     |
| `npm run db:seed`                 | Carga productos de ejemplo                     |
| `npm run db:studio`               | Explorador visual de la base de datos          |

## Estructura de carpetas

```
.claude/        Agentes, comandos y permisos de Claude Code
.github/        CI, plantillas de issues/PR, Dependabot
.vscode/        Extensiones y ajustes recomendados
docs/           Arquitectura, escalado, despliegue, flujo de Git, ADRs
prisma/         Esquema, migraciones y seed
public/         Estáticos
src/
  app/          Rutas: (shop), (auth), admin, api
  components/   ui/ (genéricos) y layout/
  features/     Lógica por dominio: catalog, cart, checkout, orders, auth
  services/     Proveedores externos: payments, storage, email
  lib/          env, db, format
  types/        Tipos compartidos
tests/          unit/ (Vitest) y e2e/ (Playwright)
```

Detalle de capas en [`docs/architecture.md`](docs/architecture.md).

## Flujo de Git

`feature/* | fix/* | chore/*` → PR a `dev` → PR a `qa` → PR a `main` (producción).
Commits con [Conventional Commits](https://www.conventionalcommits.org/es/). Sin push directo a
`dev`, `qa` ni `main`; cada PR debe pasar lint, typecheck, tests y build.
Guía completa en [`docs/git-workflow.md`](docs/git-workflow.md) y [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Despliegue

Vercel: `main` → Production; `dev`, `qa` y ramas de trabajo → Preview.
Ver [`docs/deployment.md`](docs/deployment.md).

## Ruta de escalado

El proyecto arranca gratis y escala por etapas (0 a 3) cambiando configuración, no código:
[`docs/scaling.md`](docs/scaling.md).

## Seguridad

Ver [`SECURITY.md`](SECURITY.md).

## Licencia

© 2026 Nicolas Cano Lara. Todos los derechos reservados. Ver [`LICENSE`](LICENSE).
