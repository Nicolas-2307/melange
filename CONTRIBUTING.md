# Cómo contribuir

Este es un proyecto privado de negocio con código visible. Por ahora no se aceptan
contribuciones externas; esta guía documenta el flujo interno.

## Flujo

1. Crea una rama desde `dev`: `feature/<nombre>`, `fix/<nombre>` o `chore/<nombre>` (inglés,
   kebab-case).
2. Haz commits pequeños con [Conventional Commits](https://www.conventionalcommits.org/es/).
3. Antes del PR, en local:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

4. Abre el PR hacia `dev` usando la plantilla. CI debe pasar.
5. Promociones: PR `dev → qa` y luego `qa → main` con **merge commit**.

Detalle en [`docs/git-workflow.md`](docs/git-workflow.md).

## Reglas

- Textos de UI y documentación en español; código y commits en inglés.
- Nunca subas secretos. Si agregas una variable de entorno, actualiza `src/lib/env.ts`,
  `.env.example` y `docs/deployment.md`.
- No uses `git commit --no-verify`.
