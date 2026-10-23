---
description: Crea y aplica una migración de Prisma
argument-hint: <nombre_de_la_migracion>
---

Migración: $ARGUMENTS

1. Revisa los cambios en `prisma/schema.prisma` (`git diff prisma/schema.prisma`) y explica qué
   tablas/columnas cambiarán. Si hay pérdida de datos posible, detente y pide confirmación.
2. `npx prisma format` y `npx prisma validate`.
3. `npx prisma migrate dev --name <nombre_en_snake_case>` (solo contra la base de desarrollo).
4. Muestra el SQL generado en `prisma/migrations/` y ejecuta `npm run typecheck`.
5. Nunca uses `migrate reset` ni apliques migraciones a producción desde aquí.
