# Flujo de Git

## Ramas

```
feature/*  ─┐
fix/*      ─┼── PR ──▶ dev ── PR ──▶ qa ── PR ──▶ main (producción)
chore/*    ─┘
```

| Rama                            | Propósito                       | Protección (Ruleset)                                    |
| ------------------------------- | ------------------------------- | ------------------------------------------------------- |
| `main`                          | Producción (Vercel Production)  | Solo PR, checks obligatorios, sin force-push ni borrado |
| `qa`                            | Validación antes de producción  | Igual que `main`                                        |
| `dev`                           | Integración diaria              | Solo PR, checks obligatorios, sin force-push ni borrado |
| `feature/*`, `fix/*`, `chore/*` | Trabajo puntual, salen de `dev` | Ninguna                                                 |

Se decidió **no usar `prod`**: `main` ya es producción (ver [ADR 0002](adr/0002-branching.md)).

## Día a día

Los comandos son iguales en PowerShell (Windows), macOS y Linux:

```bash
git switch dev
git pull --ff-only
git switch -c feature/product-catalog
git add .
git commit -m "feat(catalog): list products with photos"
git push -u origin HEAD
gh pr create --base dev
```

Tipos de merge:

- `feature/* → dev`: **Squash and merge** (un commit limpio por funcionalidad).
- `dev → qa` y `qa → main`: **Create a merge commit** (nunca squash, para que las ramas no
  diverjan). Los Rulesets de `qa` y `main` solo permiten este método.

## Conventional Commits

Formato: `tipo(alcance opcional): descripción en inglés y en minúscula`

| Tipo       | Uso                                       |
| ---------- | ----------------------------------------- |
| `feat`     | Nueva funcionalidad                       |
| `fix`      | Corrección de bug                         |
| `docs`     | Solo documentación                        |
| `style`    | Formato, sin cambio de lógica             |
| `refactor` | Cambio interno sin cambiar comportamiento |
| `test`     | Pruebas                                   |
| `chore`    | Mantenimiento, dependencias               |
| `ci`       | GitHub Actions                            |
| `perf`     | Rendimiento                               |

- Hook `commit-msg` (Husky + commitlint): rechaza el commit si no cumple el formato.
- Hook `pre-commit` (Husky + lint-staged): ESLint y Prettier sobre los archivos modificados.
