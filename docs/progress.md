# Progreso del proyecto

> Estado al **25 de octubre de 2026**. Documento vivo: actualízalo al cerrar cada paso o antes
> de cambiar de sesión. Sirve para retomar el trabajo sin depender del historial del chat.

## Resumen

La tienda funciona de punta a punta en desarrollo y en previews de Vercel: catálogo, carrito,
checkout por WhatsApp con zonas y calendario, cuentas de cliente, recuperación de contraseña,
panel de la dueña (pedidos, calendario, productos, categorías, configuración) y páginas legales
en plantilla. **Lo que falta para lanzar depende casi todo de los datos y cuentas de la
propietaria** (ver [datos-pendientes-propietaria.md](datos-pendientes-propietaria.md)).

## Pasos del plan

| Paso                       | Contenido                                                       | Estado                                                                                                    | PRs         |
| -------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- |
| 1 · Fundación              | Repo, estructura, calidad, CI, ramas, Rulesets                  | ✅                                                                                                        | inicial, #5 |
| 2 · Base de datos          | Prisma + Neon, esquema, migraciones, seed                       | ✅                                                                                                        | #6          |
| 3 · Autenticación          | Better Auth, registro/ingreso, rol ADMIN                        | ✅                                                                                                        | #7          |
| 4.1 · Catálogo             | Inicio, catálogo, categorías, detalle                           | ✅                                                                                                        | #8          |
| 4.2 · Carrito              | Invitado y usuario, fusión al ingresar                          | ✅                                                                                                        | #9          |
| 4.3 · Checkout             | WhatsApp, zonas, calendario, página del pedido                  | ✅                                                                                                        | #10         |
| 4.4 · Pago con Wompi       | `WompiPaymentProvider` + webhook                                | ⏸️ Bloqueado: cuenta de Wompi de la dueña                                                                 | —           |
| 5.1 · Panel: pedidos       | Lista, detalle, estados, calendario, bloqueo de días            | ✅                                                                                                        | #11         |
| 5.2a · Panel: catálogo     | Productos, presentaciones, categorías                           | ✅                                                                                                        | #14         |
| 5.2b · Fotos               | Cloudinary                                                      | ⏸️ Bloqueado: cuenta de Cloudinary del negocio ([#15](https://github.com/Nicolas-2307/melange/issues/15)) | —           |
| 5.3 · Panel: configuración | Sede, días, anticipación, cupo, zonas                           | ✅                                                                                                        | #16         |
| 6a · Despliegue de prueba  | Previews Vercel, flujo `dev → qa`, ruta de escalado             | ✅                                                                                                        | #17–#20     |
| 6b · Lanzamiento           | Cuentas del negocio, dominio, correo real, `main` en producción | ⏸️ Bloqueado: datos de la dueña                                                                           | —           |

### Trabajo previo al lanzamiento (fuera del plan original, sin datos de la dueña)

| Tarea                                                                         | Estado                     | PR / issue                                                                   |
| ----------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| Auditoría de seguridad + correcciones                                         | ✅                         | #22 (pendientes en [#21](https://github.com/Nicolas-2307/melange/issues/21)) |
| Recuperar contraseña                                                          | ✅                         | #22                                                                          |
| Páginas legales (plantillas) + autorización de datos                          | ✅                         | #23                                                                          |
| "Mis pedidos" para clientes con cuenta                                        | ⏳ Siguiente               | —                                                                            |
| SEO básico (`sitemap.xml`, `robots.txt`, datos estructurados)                 | ⏳                         | —                                                                            |
| Mantenimiento: ESLint 10, `e2e` obligatorio en Rulesets, limpieza de carritos | ⏳                         | —                                                                            |
| Chatbot                                                                       | ⏳ Después del lanzamiento | [#12](https://github.com/Nicolas-2307/melange/issues/12)                     |

## En qué vamos

**Bloque "previo al lanzamiento".** Terminado: auditoría, recuperación de contraseña y
páginas legales. Falta de este bloque: "Mis pedidos", SEO básico y mantenimiento.

La promoción `dev → qa` más reciente fue la #20. Desde entonces `dev` acumula #18, #19, #1, #22
y #23: conviene promover a `qa` al cerrar el bloque.

## Decisiones tomadas

| Decisión                                                                         | Dónde está documentada                                |
| -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Stack (Next.js, Neon + Prisma, Vercel…)                                          | [ADR 0001](adr/0001-stack.md)                         |
| Ramas `dev → qa → main`, sin `prod`                                              | [ADR 0002](adr/0002-branching.md)                     |
| Better Auth en lugar de Auth.js                                                  | [ADR 0003](adr/0003-better-auth.md)                   |
| Pedidos por WhatsApp primero; Wompi detrás de `PaymentProvider`                  | [ADR 0004](adr/0004-whatsapp-first-payments.md)       |
| Catálogo cacheado (`"use cache"`) y base de datos en el build                    | [ADR 0005](adr/0005-catalog-cache-and-db-at-build.md) |
| Promoción a ADMIN solo probando el buzón, cerrando sesiones                      | [ADR 0006](adr/0006-admin-promotion.md)               |
| Previews en Vercel Hobby; `main` desactivado hasta el lanzamiento                | [ADR 0007](adr/0007-vercel-previews.md)               |
| Prisma 7.10.1 estable (no la 8 RC); adaptador `pg` (portable)                    | [ADR 0001](adr/0001-stack.md), `docs/architecture.md` |
| Variantes con precio propio; compra como invitado; correo + contraseña           | `docs/architecture.md` (modelo de datos)              |
| Zonas de domicilio y disponibilidad en la base de datos (editables en el panel)  | `docs/architecture.md` (checkout)                     |
| Calendario propio sin librerías (cliente y dueña)                                | `docs/architecture.md`                                |
| Varios admins con `ADMIN_EMAILS` (lista)                                         | ADR 0006, `docs/architecture.md`                      |
| Límites de intentos en base de datos (auth, checkout, carritos)                  | `docs/architecture.md` (autenticación)                |
| Autorización de datos guardada como prueba (Ley 1581)                            | `docs/architecture.md` (legal)                        |
| Datos de la dueña como valores de ejemplo, sin bloquear el trabajo               | `AGENTS.md`, `datos-pendientes-propietaria.md`        |
| Claude une los PRs con CI en verde (squash a `dev`, merge commit en promociones) | `AGENTS.md`                                           |

Ninguna decisión pendiente necesita ADR por ahora. Cuando se implemente Wompi (4.4) o el
chatbot, cada uno merece el suyo.

## Problemas pendientes

- **Auditoría** ([#21](https://github.com/Nicolas-2307/melange/issues/21)): CSP de scripts con
  nonce, captcha (Turnstile) en checkout y registro, limpieza de carritos de invitado,
  enumeración de cuentas en el registro, carrera de cupo diario, reglas `deny` de
  `.claude/settings.json` (decisión del desarrollador).
- **ESLint 9 obsoleto:** pasar a ESLint 10 revisando compatibilidad con `eslint-config-next`.
- **Check `e2e`** aún no es obligatorio en los Rulesets de `dev`, `qa` y `main`.
- **Producción sin correo real:** se necesita un `EmailProvider` real (p. ej. Resend) antes del
  lanzamiento; con `console` la app no arranca en producción (a propósito).
- **Textos legales:** son plantillas; la dueña y un abogado deben revisarlos (en especial el
  retracto, art. 47 Ley 1480, modificado por la Ley 2439 de 2024).
- **Ruido conocido:** Better Auth registra `Error: aborted` en los logs cuando el navegador
  navega mientras una petición sigue abierta (al ingresar). Es inofensivo.
- **Desarrollo local:** tras cambiar de rama o unir un PR, reiniciar `npm run dev` (Turbopack
  puede quedarse con módulos viejos). No correr `npm ci` con `npm run dev` abierto (Windows
  bloquea archivos de `node_modules`).

## Siguiente paso exacto

1. Actualizar `dev` local (`git switch dev` y `git pull`) y reiniciar `npm run dev`.
2. Crear `feature/my-orders` desde `dev` y construir **"Mis pedidos"**:
   - ruta `/cuenta/pedidos` (protegida con `requireUser`), dentro de `<Suspense>`;
   - lista de pedidos del usuario (`orders.userId`) con número, fecha de entrega, total y
     estado (`ORDER_STATUS_LABEL`), enlazando a `/pedidos/<publicToken>`;
   - enlace "Mis pedidos" en el encabezado para usuarios con sesión;
   - pruebas: unitaria de la consulta si hay lógica, e2e (cliente con cuenta hace un pedido y
     lo ve en "Mis pedidos"; otro cliente no lo ve).
3. Después: SEO básico, mantenimiento y promoción `dev → qa`.
