# Datos pendientes de la propietaria

Todo lo que debe entregar o crear la dueña del negocio. Mientras no llegue, el proyecto usa
**valores de ejemplo** y nada se bloquea. Esta lista se actualiza cada vez que se agrega o se
quita algo que dependa de ella.

**Estados:** ⏳ pendiente · ✅ recibido y configurado · 🚫 ya no aplica

**Cómo se reemplaza:** casi nada requiere cambiar código. Cada dato se pone en una **variable
de entorno** (en `.env.local` y en Vercel) o se edita en el **panel** (Paso 5).

> No pegues aquí claves, contraseñas ni datos personales: este archivo está en un repositorio
> público. Solo se marca el estado.

## Contacto y negocio

| Dato                                                             | Dónde va                       | Valor de ejemplo                  | Estado |
| ---------------------------------------------------------------- | ------------------------------ | --------------------------------- | ------ |
| Número de WhatsApp del negocio                                   | `NEXT_PUBLIC_WHATSAPP_NUMBER`  | `570000000000`                    | ⏳     |
| Correo(s) de quien administrará el panel                         | `ADMIN_EMAILS`                 | Correo del desarrollador          | ⏳     |
| Dirección exacta de la sede (recogidas)                          | Panel → Configuración          | "Parque de La Floresta, Medellín" | ⏳     |
| Nombre comercial definitivo, logo y colores                      | `public/`, textos de la tienda | "Melange", sin logo               | ⏳     |
| Datos legales (razón social, NIT o RUT)                          | Pie de página, políticas       | —                                 | ⏳     |
| Política de privacidad y tratamiento de datos (Ley 1581 de 2012) | Página legal                   | —                                 | ⏳     |
| Términos y condiciones, cambios y devoluciones                   | Página legal                   | —                                 | ⏳     |

## Catálogo y operación

| Dato                                       | Dónde va                          | Valor de ejemplo                          | Estado |
| ------------------------------------------ | --------------------------------- | ----------------------------------------- | ------ |
| Productos, descripciones y presentaciones  | Panel → Productos                 | 7 productos del seed                      | ⏳     |
| Precios                                    | Panel → Productos                 | Precios inventados                        | ⏳     |
| Fotos de los productos                     | Panel → Productos (Cloudinary)    | Ilustraciones provisionales               | ⏳     |
| Categorías                                 | Panel → Categorías                | Tortas, Galletas, Postres                 | ⏳     |
| Zonas de domicilio y su costo              | Panel → Configuración → Zonas     | 7 zonas desde La Floresta, $5.000–$15.000 | ⏳     |
| Días de trabajo                            | Panel → Configuración             | Martes a domingo                          | ⏳     |
| Anticipación mínima de pedidos             | Panel → Configuración             | 1 día                                     | ⏳     |
| Fechas sin servicio (festivos, vacaciones) | Panel → Calendario → Bloquear día | Ninguna                                   | ⏳     |
| Máximo de pedidos por día                  | Panel → Configuración             | Sin límite                                | ⏳     |

## Chatbot (futuro, issue #12)

Solo hace falta cuando se implemente el chatbot: [issue #12](https://github.com/Nicolas-2307/melange/issues/12).

| Dato                                                  | Dónde va                            | Valor de ejemplo                         | Estado |
| ----------------------------------------------------- | ----------------------------------- | ---------------------------------------- | ------ |
| Preguntas frecuentes y sus respuestas                 | Configuración del chatbot           | —                                        | ⏳     |
| Tono y forma de hablar del asistente                  | Configuración del chatbot           | Cercano y amable, en español de Colombia | ⏳     |
| Horario de atención por WhatsApp                      | Configuración del chatbot           | —                                        | ⏳     |
| Presupuesto mensual máximo para la IA                 | Variable de entorno (tope de gasto) | —                                        | ⏳     |
| ¿Chatbot también en WhatsApp? (WhatsApp Business API) | Decisión de alcance                 | Solo en la web                           | ⏳     |

## Cuentas de servicios (a nombre del negocio)

Detalle del traspaso en [deployment.md](deployment.md#traspaso-al-propietario-antes-de-la-primera-venta).

| Cuenta                            | Para qué                                | Mientras tanto                                               | Estado |
| --------------------------------- | --------------------------------------- | ------------------------------------------------------------ | ------ |
| Correo del negocio                | Abrir todas las demás cuentas           | —                                                            | ⏳     |
| Wompi (comercio)                  | Pagos en línea (Paso 4.4)               | Pedido por WhatsApp; Wompi en pausa                          | ⏳     |
| Llaves de prueba de Wompi         | Desarrollar el Paso 4.4                 | —                                                            | ⏳     |
| Llaves de producción de Wompi     | Cobrar de verdad                        | —                                                            | ⏳     |
| Cloudinary                        | Fotos reales                            | Cuenta del desarrollador con fotos de prueba                 | ⏳     |
| Neon (base de producción)         | Pedidos y clientes reales               | Cuenta del desarrollador, rama `dev`                         | ⏳     |
| Vercel Pro (uso comercial)        | Publicar la tienda                      | Previews en la cuenta Hobby del desarrollador (no comercial) | ⏳     |
| Dominio (ej. `melange.co`)        | Dirección de la tienda                  | —                                                            | ⏳     |
| Proveedor de correo transaccional | Confirmaciones y verificación de correo | Correos impresos en la consola                               | ⏳     |
| GitHub (organización del negocio) | Dueña del código                        | Repo en la cuenta del desarrollador                          | ⏳     |
