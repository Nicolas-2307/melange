# Ruta de escalado

Cada etapa se alcanza **cambiando configuración, no código** (ver
[architecture.md](architecture.md)): proveedores detrás de interfaces y todo por variables de
entorno.

> **Precios verificados el 24 de octubre de 2026** en las páginas oficiales enlazadas al final.
> Cambian con el tiempo: revísalos antes de pagar. Conversión con la TRM del 21 de octubre de
> 2026: **US$1 ≈ $3.160 COP** (redondeado).

## Resumen

| Etapa                   | Disparador                                         | Costo mensual aprox.                             | Qué cambia                                                      |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| **0 · Desarrollo**      | Hoy                                                | **$0**                                           | Todo gratis, previews en Vercel Hobby, pedidos por WhatsApp     |
| **1 · Primeras ventas** | La dueña va a vender de verdad                     | **≈ US$22 ≈ $70.000** + comisión Wompi por venta | Vercel Pro del negocio, dominio, correo real                    |
| **2 · Crecimiento**     | Se acercan los límites gratis (abajo)              | **≈ US$60–160 ≈ $190.000–505.000**               | Base de datos de pago, correo de pago, más fotos                |
| **3 · Alto volumen**    | Picos de tráfico/pedidos, varias personas operando | **US$200+ ≈ $630.000+** (estimado)               | Monitoreo, colas, Neon Scale, backend aparte solo si hace falta |

## Etapa 0 · Gratis (desarrollo) — estado actual

| Servicio   | Plan                | Costo | Límites que importan                                                                                                      |
| ---------- | ------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| Vercel     | Hobby               | $0    | **Solo uso personal no comercial**. 100 GB de tráfico/mes, 1 M de invocaciones                                            |
| Neon       | Free                | $0    | 100 CU-horas/mes por proyecto, 1 GB, historial de restauración de 6 h                                                     |
| Cloudinary | Free                | $0    | 25 créditos/30 días (1 crédito = 1 GB guardado **o** 1 GB de tráfico **o** 1.000 transformaciones). Permite uso comercial |
| Correo     | Consola             | $0    | Los correos se imprimen en la terminal / logs                                                                             |
| Pagos      | WhatsApp            | $0    | El pago se acuerda por fuera de la tienda                                                                                 |
| GitHub     | Free (repo público) | $0    | Rulesets y secret scanning gratis en repos públicos                                                                       |

**No sirve para vender:** Vercel Hobby prohíbe el uso comercial, y en producción hace falta un
correo real (verificación de cuenta del admin, confirmaciones de pedido).

## Etapa 1 · Primeras ventas

**Disparador:** la dueña tiene sus datos y cuentas, y va a recibir pedidos reales.

| Servicio                   | Plan                                                 | Costo mensual            |
| -------------------------- | ---------------------------------------------------- | ------------------------ |
| Vercel                     | **Pro** (1 desarrollador, incluye US$20 de consumo)  | US$20 ≈ $63.200          |
| Dominio (`.co`)            | Registro anual (US$20–45/año según registrador)      | ≈ US$2–4 ≈ $6.000–12.000 |
| Correo                     | Resend **Free** (3.000/mes, 100/día, 3 dominios)     | $0                       |
| Neon                       | Free (suficiente para empezar)                       | $0                       |
| Cloudinary                 | Free                                                 | $0                       |
| Wompi (opcional, Paso 4.4) | Sin mensualidad; **≈ 2,65 % + $700 + IVA por venta** | Por venta                |

**Pasos de migración**

1. Hacer el [traspaso al propietario](deployment.md#traspaso-al-propietario-antes-de-la-primera-venta):
   cuentas del negocio en Vercel (Pro), Neon, Cloudinary y GitHub.
2. Neon (cuenta del negocio): proyecto `melange` en `us-east-1` → copiar `DATABASE_URL`
   (pooled) y `DIRECT_URL` → `npm run db:deploy` para crear las tablas.
3. Cargar productos, zonas y disponibilidad desde el panel (o `npm run db:seed` y luego editar).
4. Dominio: comprarlo a nombre de la dueña → Vercel → _Settings → Domains_ → agregarlo y crear
   los registros DNS que indique Vercel.
5. Correo: cuenta de Resend del negocio → verificar el dominio (registros DNS) → crear la API key →
   implementar `ResendEmailProvider` (un archivo en `src/services/email/`) y poner
   `EMAIL_PROVIDER=resend` + la llave en Vercel (Production).
6. Variables de **Production** en Vercel: las de [deployment.md](deployment.md) con
   `NEXT_PUBLIC_SITE_URL=https://<dominio>`, `BETTER_AUTH_SECRET` nuevo,
   `NEXT_PUBLIC_WHATSAPP_NUMBER` del negocio, `ADMIN_EMAILS` de la dueña.
7. Quitar `"main": false` de `vercel.json` (PR a `dev` → `qa` → `main`): desde ahí `main`
   despliega a producción.
8. Probar en producción: registro de la dueña + verificación de correo (rol ADMIN), un pedido de
   prueba completo, y cancelarlo desde el panel.

## Etapa 2 · Crecimiento

**Disparadores (cualquiera):**

- Neon avisa que el proyecto se acerca a **100 CU-horas/mes** (al agotarse, la base se suspende
  hasta el mes siguiente) o a **1 GB**, o se necesita más de 6 h de historial de restauración.
- Se envían **más de 100 correos al día** (límite de Resend Free).
- Cloudinary pasa de **25 créditos** (muchas fotos o mucho tráfico de imágenes).
- El consumo de Vercel supera el crédito de US$20 incluido en Pro.

| Servicio   | Plan                                                                           | Costo mensual aprox.                                          |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Neon       | **Launch**: US$0,106/CU-hora + US$0,35/GB-mes, sin mínimo, historial de 7 días | Ej.: 0,25 CU siempre encendido (≈ 183 CU-h) ≈ US$20 ≈ $63.000 |
| Correo     | Resend **Pro** (50.000 correos/mes, sin límite diario, 10 dominios)            | US$20 ≈ $63.200                                               |
| Cloudinary | **Plus** (225 créditos): US$89 anual / US$99 mensual — solo si hace falta      | US$89–99 ≈ $281.000–313.000                                   |
| Vercel     | Pro + consumo extra según uso                                                  | US$20+                                                        |

**Pasos de migración**

1. Neon: _Billing → Upgrade_ a Launch. Mismo proyecto y mismas URLs: **no cambia nada en el
   código ni en Vercel**.
2. Resend: _Upgrade_ a Pro en la misma cuenta; la API key no cambia.
3. Cloudinary: _Upgrade_ a Plus en la misma cuenta; las URLs de las fotos no cambian.
4. Caché: el catálogo ya está cacheado (1 h, invalidación con `updateTag`). Si Neon sigue
   saturado, revisar en _Observability_ de Vercel qué páginas consultan más la base y cachear
   esas lecturas antes de pagar más cómputo.

## Etapa 3 · Alto volumen

**Disparadores:** temporadas con picos (Amor y Amistad, Navidad), varias personas atendiendo
pedidos, errores que nadie ve a tiempo, o tareas lentas (correos masivos, reportes) que
bloquean las peticiones.

| Necesidad               | Opción                                                                                                                                            | Costo mensual aprox.  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Monitoreo de errores    | Sentry Developer (gratis, 1 usuario, 5k errores) → **Team** (US$26 anual / US$29 mensual, 50k errores)                                            | $0 → ≈ $82.000–92.000 |
| Más cómputo en la base  | Neon **Scale** (US$0,222/CU-hora)                                                                                                                 | Según uso             |
| Tareas en segundo plano | Una cola gestionada (verificar opciones y precios en ese momento)                                                                                 | Según uso             |
| CDN                     | Ya incluido: Vercel sirve estáticos y páginas cacheadas por CDN                                                                                   | Incluido en Pro       |
| Backend aparte          | **Solo si** aparecen integraciones pesadas (ERP, facturación electrónica DIAN a escala). Mientras tanto, Server Actions + Route Handlers alcanzan | —                     |

**Pasos de migración**

1. Sentry: crear proyecto → instalar su SDK para Next.js → `SENTRY_DSN` en Vercel.
   (Agregar la variable a `env.ts`, `.env.example` y `deployment.md`.)
2. Neon: _Upgrade_ a Scale si el cómputo de Launch no alcanza; mismas URLs.
3. Mover a una cola lo que hoy se hace con `after()` (correos) solo cuando su volumen lo
   justifique; detrás de una interfaz propia, como los demás servicios.
4. Revisar índices y consultas lentas con el subagente `db-architect` antes de pagar más.

## Fuentes

- Vercel: [precios](https://vercel.com/pricing) y [uso justo / uso comercial](https://vercel.com/docs/limits/fair-use-guidelines)
- Neon: [precios](https://neon.com/pricing) y [límites del plan gratis](https://neon.com/faqs/free-plan-limits-and-quotas)
- Cloudinary: [precios](https://cloudinary.com/pricing) y [FAQ del plan gratis](https://cloudinary.com/documentation/developer_onboarding_faq_free_plan)
- Resend: [precios](https://resend.com/pricing)
- Sentry: [precios](https://sentry.io/pricing/)
- Wompi: [tarifas (Cambio Colombia, sept. 2026)](https://cambiocolombia.com/peso-a-peso-paso-a-paso/articulo/2026/9/wompi-amplia-los-pagos-sin-contacto-y-baja-al-uno-por-ciento-la-tarifa-de-los-pagos-con-qr) — confirmar en el panel de Wompi
- Dominio `.co`: [Cloudflare Registrar](https://www.cloudflare.com/it-it/application-services/products/registrar/buy-co-domains/) y [comparativo de precios](https://domainoffer.net/tld/co?page=3)
- TRM: [Portafolio, 21 oct. 2026](https://www.portafolio.co/economia/finanzas/precio-del-dolar-hoy-en-colombia-la-divisa-inicia-cerca-de-3-160-este-21-de-octubre-504832)
