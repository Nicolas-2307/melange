# ADR 0002 — Modelo de ramas sin `prod`

- **Estado:** Aceptado
- **Fecha:** 2026-10-23

## Contexto

Se propuso `dev → qa → prod → main`. Vercel despliega a producción desde una rama configurable.

## Decisión

Usar `dev → qa → main`, con `main` como rama de producción. Se elimina `prod`.

## Consecuencias

- (+) Un merge menos por release; no hay dos ramas que representen lo mismo.
- (+) `main` es lo que ve quien visita el repositorio y lo que está en producción.
- (−) Si en el futuro hace falta congelar releases, se puede añadir una rama `release/*`.
