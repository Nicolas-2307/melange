# ADR 0005 — Catálogo cacheado y base de datos en el build

- **Estado:** Aceptado
- **Fecha:** 2026-10-23

## Contexto

El proyecto usa Next.js 16 con Cache Components. El límite que primero se agota en el plan
gratis de Neon son las horas de cómputo, y el catálogo se lee en casi todas las visitas.

## Decisión

- Las lecturas del catálogo (`src/features/catalog/queries.ts`) usan `"use cache"` con la
  etiqueta `catalog` y duración de 1 hora. Toda escritura del panel llama
  `updateTag(CATALOG_TAG)`.
- `/` y `/productos` se prerenderizan en el build, así que **el build necesita base de datos**:
  en CI se usa un PostgreSQL temporal (migraciones + seed); en Vercel, `buildCommand` ejecuta
  `npm run db:deploy && npm run build`.
- Los datos por visitante (sesión, carrito, checkout, panel) se leen dentro de `<Suspense>` y,
  cuando dependen de la hora, después de `connection()`.

## Consecuencias

- (+) Muy pocas consultas a Neon por visita; las páginas públicas cargan en ~40 ms.
- (+) Una prueba e2e verifica que los cambios del panel se ven al instante en la tienda.
- (−) Un build sin `DATABASE_URL` válida falla; las previews comparten la rama `dev` de Neon.
