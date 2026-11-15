# ADR 0004 — Pedidos por WhatsApp primero, Wompi después

- **Estado:** Aceptado
- **Fecha:** 2026-10-23

## Contexto

El plan incluía pagos con Wompi más una alternativa por WhatsApp. La cuenta de comercio de
Wompi debe estar a nombre de la propietaria (recibe el dinero, firma el contrato, responde ante
la DIAN), y ella aún no la tiene.

## Decisión

- El checkout se lanza con **pedido por WhatsApp**: se guarda el pedido y el cliente envía un
  mensaje ya armado; la dueña confirma y acuerda el pago.
- El pago va detrás de `PaymentProvider` (`src/services/payments/`), elegido con
  `PAYMENT_PROVIDER`. Hoy solo acepta `whatsapp`; Wompi (Paso 4.4) será otra implementación.
- Cada intento de pago es un `Payment` (Wompi exige referencia única por transacción).

## Consecuencias

- (+) La tienda puede vender sin pasarela; agregar Wompi no toca el checkout.
- (+) `PAYMENT_PROVIDER=wompi` fallará al arrancar hasta que exista su implementación (validado
  en `env.ts`), en vez de fallar en un pedido real.
- (−) El pago se concilia a mano en el panel ("Registrar pago recibido").
