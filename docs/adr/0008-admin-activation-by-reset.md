# ADR 0008 — El panel se activa solo con el enlace de «¿Olvidaste tu contraseña?»

- **Estado:** Aceptado (reemplaza al [ADR 0006](0006-admin-promotion.md))
- **Fecha:** 2026-11-15

## Contexto

El ADR 0006 daba ADMIN al probar el buzón de un correo de `ADMIN_EMAILS` y, en ese momento,
cerraba las sesiones y descartaba la contraseña. La auditoría de noviembre mostró que eso no
basta: es una **carrera**. Si alguien registró antes el correo de la dueña y está ingresando
justo cuando ella prueba su buzón, su ingreso ya validó la contraseña vieja y crea la sesión
_después_ de la limpieza, sobre una cuenta que ya es ADMIN. En local el ataque funcionó en 3 de
3 intentos por cada camino (verificación y restablecimiento).

Limpiar "en el momento de promover" siempre deja esa ventana. Hay que evitar el estado peligroso
desde el principio.

## Decisión

**Sobre una cuenta que puede llegar a ser ADMIN, nadie distinto a quien controla el buzón puede
tener nunca una contraseña ni una sesión.** En concreto (`src/features/auth/admin-promotion.ts`
y `auth.ts`):

1. Los correos de `ADMIN_EMAILS` **no se pueden registrar** por el formulario público. La
   respuesta es la misma que para cualquier correo que ya tiene cuenta.
2. La única entrada es **«¿Olvidaste tu contraseña?»**. Al pedir el enlace para uno de esos
   correos, el servidor se asegura de que la cuenta exista y esté limpia:
   - si no existe, la crea sin contraseña;
   - si existe, no es ADMIN y ya tiene contraseña (se registró antes de que el correo entrara
     a `ADMIN_EMAILS`, por la dueña o por un impostor), la **reemplaza por una fila nueva con
     otro id**. Los ingresos en curso siguen apuntando al id viejo y fallan.
3. El rol se concede **solo al completar el restablecimiento** con el enlace del correo. La
   contraseña que queda es la única que ha tenido la cuenta.
4. Verificar el correo ya no concede nada.
5. Se desactivan las rutas de Better Auth que la tienda no usa (`disabledPaths`): cambiar
   contraseña con sesión, editar el perfil, listar o revocar sesiones, etc.

## Consecuencias

- (+) No queda ventana: no hay credenciales ajenas que limpiar. Hay pruebas e2e del flujo, del
  caso de la cuenta previa y de la carrera (ingresos simultáneos durante la activación).
- (+) La dueña entra en un solo paso: abre el enlace, crea su contraseña e ingresa.
- (−) Si la dueña ya tenía una cuenta de clienta con ese correo, al activarse se reemplaza: sus
  pedidos anteriores dejan de aparecer en «Mis pedidos» (siguen visibles en el panel y por su
  enlace).
- (−) Cualquiera puede pedir el enlace para el correo de la dueña (le llegan correos que no
  pidió), igual que con cualquier cuenta. El límite es 3 por minuto por IP.
- Sigue igual: quitar un correo de `ADMIN_EMAILS` no quita el rol; se hace en
  `npm run db:studio` (users → role).
