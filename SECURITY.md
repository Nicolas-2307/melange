# Política de seguridad

## Reportar una vulnerabilidad

**No abras un issue público.** Usa el reporte privado de GitHub:
pestaña **Security → Report a vulnerability** de este repositorio.

Incluye: descripción, pasos para reproducir, impacto y, si puedes, una sugerencia de corrección.
Recibirás respuesta en un plazo de 7 días.

## Alcance

- Código de este repositorio y el sitio desplegado desde `main`.
- Fuera de alcance: servicios de terceros (Vercel, Neon, Cloudinary, Wompi), que tienen sus
  propios programas de seguridad.

## Prácticas del proyecto

- Secretos solo en variables de entorno (`.env.local` y Vercel), nunca en Git.
- GitHub secret scanning y push protection activados.
- Dependabot para actualizaciones de dependencias y alertas.
- Webhooks de pago verificados por firma; montos recalculados en el servidor.
