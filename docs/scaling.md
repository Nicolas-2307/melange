# Ruta de escalado

> **Borrador.** Los costos y límites se verificarán con fuentes actuales y se completarán en el
> **Paso 6 (Despliegue)**. No tomes decisiones de compra con este borrador.

Principio: cada etapa se alcanza **cambiando configuración, no código** (ver
[architecture.md](architecture.md)).

| Etapa                      | Disparador                               | Qué cambia                                                                 |
| -------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| **0 — Gratis, desarrollo** | Inicio del proyecto                      | Vercel Hobby, Neon Free, Cloudinary Free, Wompi sandbox, correo en consola |
| **1 — Primeras ventas**    | Primera venta real / dominio propio      | Hosting con uso comercial permitido, dominio propio, Wompi producción      |
| **2 — Crecimiento**        | Límites del plan gratis de BD o imágenes | Base de datos de pago, caché, correo transaccional                         |
| **3 — Alto volumen**       | Picos de tráfico / pedidos               | CDN, colas, monitoreo, backend separado si hace falta                      |

## ⚠️ Restricción conocida desde ya

El plan **Hobby de Vercel es solo para uso personal/no comercial**. La Etapa 0 sirve para
desarrollar, pero **antes de la primera venta real** hay que pasar a la Etapa 1.

## Etapa 0 — Gratis (desarrollo)

_Por completar en el Paso 6: límites verificados, costo (USD/COP) y pasos._

## Etapa 1 — Primeras ventas

_Por completar en el Paso 6._

## Etapa 2 — Crecimiento

_Por completar en el Paso 6._

## Etapa 3 — Alto volumen

_Por completar en el Paso 6._
