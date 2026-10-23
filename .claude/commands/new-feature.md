---
description: Crea una rama feature/* actualizada desde dev
argument-hint: <nombre-en-kebab-case>
---

Crea una rama de trabajo para: $ARGUMENTS

1. Verifica con `git status` que no haya cambios sin confirmar; si los hay, detente y avisa.
2. `git switch dev` y `git pull --ff-only origin dev`.
3. Crea la rama `feature/<nombre>` en kebab-case e inglés (`git switch -c feature/<nombre>`).
   Si el pedido es una corrección usa `fix/`; si es mantenimiento, `chore/`.
4. Confirma el nombre de la rama creada.
