# ADR 0001 — Stack tecnológico

- **Estado:** Aceptado
- **Fecha:** 2026-10-23

## Contexto

Una sola persona construye una tienda online de repostería en Colombia. Debe arrancar gratis y
escalar sin reescribir código.

## Decisión

Next.js (App Router) + TypeScript estricto, Tailwind CSS, PostgreSQL en Neon con Prisma, Auth.js (reemplazado por Better Auth, ver ADR 0003),
Cloudinary, Wompi + pedido por WhatsApp, Zod, Vitest + Playwright, Vercel y npm.
Pagos, almacenamiento y correo van detrás de interfaces propias, elegidas por variable de entorno.

## Consecuencias

- (+) Un solo lenguaje y un solo repositorio; despliegue sin servidores que administrar.
- (+) Cambiar Neon por otro PostgreSQL es cambiar `DATABASE_URL`.
- (−) Vercel Hobby no permite uso comercial: hay que pasar a un plan de pago antes de vender
  (ver [scaling.md](../scaling.md)).
