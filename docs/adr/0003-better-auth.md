# ADR 0003 — Better Auth en lugar de Auth.js

- **Estado:** Aceptado (reemplaza la elección de Auth.js del [ADR 0001](0001-stack.md))
- **Fecha:** 2026-10-23

## Contexto

En septiembre de 2025 Auth.js pasó a ser parte de Better Auth. Desde entonces solo recibe
parches de seguridad y problemas urgentes, su v5 (la compatible con App Router) sigue en beta
(`5.0.0-beta.32`), y sus mantenedores recomiendan Better Auth para proyectos nuevos.
Fuente: <https://better-auth.com/blog/authjs-joins-better-auth>.

## Decisión

Usar **Better Auth** con:

- Correo y contraseña (hash con scrypt, guardado en la tabla `accounts`).
- Sesiones en la base de datos (revocables), cookie `httpOnly`.
- Adaptador Prisma y tablas `sessions`, `accounts`, `verifications`, `rate_limits`.
- Límite de intentos guardado en la base de datos (funciona con varias instancias serverless):
  5 ingresos y 3 registros por minuto por IP en producción.
- Rol `ADMIN` asignado a los correos de `ADMIN_EMAILS` (lista) **solo después de verificar el correo**, para que nadie
  pueda apropiarse del panel registrándose primero con el correo del dueño.

## Consecuencias

- (+) Librería mantenida activamente, con roles, verificación y límites de intentos integrados.
- (+) Agregar Google u otro proveedor después es configuración, no una reescritura.
- (−) La verificación de correo en producción requiere un proveedor de correo real
  (`EMAIL_PROVIDER`), que se configura antes del primer despliegue (Paso 6).
