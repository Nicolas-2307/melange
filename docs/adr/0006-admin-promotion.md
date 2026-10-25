# ADR 0006 — Promoción segura a ADMIN por correo

- **Estado:** Aceptado (corrige el diseño del Paso 3)
- **Fecha:** 2026-10-25

## Contexto

`ADMIN_EMAILS` lista los correos que administran la tienda. El diseño original daba ADMIN al
verificar el correo. La auditoría de seguridad mostró un ataque: alguien registra el correo de
la dueña antes que ella (eligiendo la contraseña), queda con sesión, y cuando ella abre el enlace
de verificación la cuenta del atacante pasa a ADMIN.

## Decisión

ADMIN se concede solo al **probar el buzón** —enlace de verificación o restablecimiento de
contraseña— y en ese momento (`src/features/auth/admin-promotion.ts`):

- se **cierran todas las sesiones** de la cuenta;
- si fue por verificación, se **descarta la contraseña** elegida al registrarse (la dueña crea
  la suya con «¿Olvidaste tu contraseña?»);
- `requireAdmin()` lee siempre el rol desde la base de datos (sin la caché de sesión).

## Consecuencias

- (+) Quien no controla el buzón no obtiene ADMIN ni conserva acceso. Hay una prueba e2e que
  reproduce el ataque.
- (−) Primer ingreso de la dueña en dos pasos (verificar y crear contraseña); el correo de
  verificación lo explica.
- Quitar un correo de `ADMIN_EMAILS` no quita el rol: se hace en `npm run db:studio`.
