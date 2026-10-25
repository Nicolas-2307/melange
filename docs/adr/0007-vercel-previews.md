# ADR 0007 — Previews en Vercel Hobby y producción desactivada hasta el lanzamiento

- **Estado:** Aceptado
- **Fecha:** 2026-10-24

## Contexto

Vercel Hobby es solo para uso personal no comercial; cuenta como comercial incluso un
desarrollador pagado. El desarrollo de Melange no es remunerado, pero la tienda venderá. Las
cuentas de la propietaria (Vercel Pro, dominio, Neon de producción, correo) aún no existen.

## Decisión

- Previews de `dev`, `qa` y ramas de trabajo en la cuenta **Hobby del desarrollador**, con
  variables solo en el ambiente Preview y Deployment Protection activa.
- `vercel.json` desactiva los despliegues de `main` (`git.deploymentEnabled.main = false`)
  hasta el lanzamiento (Paso 6b), cuando el proyecto pasa a una cuenta **Pro del negocio**.
- La URL de cada preview se toma de `VERCEL_BRANCH_URL`/`VERCEL_URL` (también orígenes de
  confianza del login), así que no hace falta `NEXT_PUBLIC_SITE_URL` en Preview.
- `EMAIL_PROVIDER=console` está prohibido cuando `VERCEL_ENV=production`.

## Consecuencias

- (+) Cada PR tiene una preview para probar en línea sin costo.
- (+) Nadie ve una "tienda" con datos de ejemplo como si fuera real.
- (−) Antes de vender es obligatorio el traspaso a cuentas del negocio (`docs/deployment.md`).
