---
description: Ejecuta los checks y abre un PR hacia dev con la plantilla
---

1. Ejecuta `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`. Si alguno falla,
   detente, muestra el error y no abras el PR.
2. Verifica que la rama actual sea `feature/*`, `fix/*` o `chore/*` y haz `git push -u origin HEAD`.
3. Resume los commits (`git log dev..HEAD --oneline`) y el diff.
4. Abre el PR con `gh pr create --base dev`, título en formato Conventional Commits y el cuerpo
   siguiendo `.github/pull_request_template.md` (en español).
5. Devuelve el enlace del PR.
