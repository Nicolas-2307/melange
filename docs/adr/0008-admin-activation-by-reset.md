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

**Una cuenta solo llega a ser ADMIN si nunca ha tenido contraseña, y recibe la primera con el
enlace del correo en ese mismo paso.** En concreto (`src/features/auth/admin-promotion.ts` y
`auth.ts`):

1. Los correos de `ADMIN_EMAILS` **no se pueden registrar** por el formulario público. Ante el
   intento, el servidor crea (si falta) la cuenta sin contraseña y deja que Better Auth
   responda lo de siempre: "ya existe una cuenta con ese correo".
2. La única entrada es **«¿Olvidaste tu contraseña?»**. Al pedir el enlace para uno de esos
   correos, el servidor se asegura de que la cuenta exista y esté limpia:
   - si no existe, la crea sin contraseña;
   - si existe, no es ADMIN y ya tiene contraseña (se registró antes de que el correo entrara
     a `ADMIN_EMAILS`, por la dueña o por un impostor), la **reemplaza por una fila nueva con
     otro id**. Los ingresos en curso siguen apuntando al id viejo y fallan.
3. El rol se concede en **un solo lugar**: justo antes de ejecutar un restablecimiento, si el
   enlace es válido, el correo está en la lista y la cuenta **no tiene ninguna credencial**.
   Si la cuenta no es ADMIN y ya tiene credenciales (por ejemplo, un enlace emitido antes de
   listar el correo o antes de desplegar esta regla), el restablecimiento se **rechaza** como
   enlace inválido; al pedir uno nuevo se aplica el punto 2.
4. Verificar el correo ya no concede nada, y el enlace del correo lo arma la tienda (no usa el
   destino que eligió quien pidió el correo).
5. Se desactivan las rutas de Better Auth que la tienda no usa (`disabledPaths`): cambiar
   contraseña con sesión, editar el perfil, listar o revocar sesiones, etc.

## Consecuencias

- (+) No depende de limpiar a tiempo: sobre la cuenta que se activa nunca hubo credenciales
  ajenas. Si algo falla en la comprobación, el resultado es que el rol no se concede. Hay
  pruebas e2e del flujo, de la cuenta previa, del enlace viejo y de ingresos simultáneos
  durante la activación.
- (+) La dueña entra en un solo paso: abre el enlace, crea su contraseña e ingresa.
- (−) Si ya existía una cuenta de clienta con ese correo, se reemplaza en cuanto **alguien**
  pide el enlace (o intenta registrarlo): sus pedidos anteriores dejan de aparecer en «Mis
  pedidos» (siguen visibles en el panel y por su enlace).
- (−) Cualquiera puede pedir el enlace para el correo de la dueña (le llegan correos que no
  pidió), igual que con cualquier cuenta. El límite es 3 por minuto por IP.
- Las cuentas que **ya eran ADMIN** con el diseño anterior se dan por buenas. Antes de usar una
  base de datos en producción conviene restablecer su contraseña con el enlace (cierra sus
  sesiones) o revisar en `npm run db:studio` que no haya administradoras inesperadas.
- Sigue igual: quitar un correo de `ADMIN_EMAILS` no quita el rol; se hace en
  `npm run db:studio` (users → role).
