# Arquitectura

## Vista general

```mermaid
flowchart LR
  U[Cliente / Dueño<br/>navegador] -->|HTTPS| V[Vercel<br/>Next.js App Router]
  V --> F[features/*<br/>lógica de negocio]
  F --> DB[(PostgreSQL<br/>Neon vía Prisma)]
  F --> S[services/*<br/>interfaces propias]
  S --> P[PaymentProvider<br/>Wompi · WhatsApp]
  S --> ST[StorageProvider<br/>Cloudinary]
  S --> E[EmailProvider<br/>consola · transaccional]
  W[Webhooks de Wompi] -->|POST /api/...| V
```

## Capas

| Capa            | Carpeta                     | Responsabilidad                                               | Puede depender de |
| --------------- | --------------------------- | ------------------------------------------------------------- | ----------------- |
| Presentación    | `src/app`, `src/components` | Rutas, páginas, UI. Server Components por defecto             | features, lib     |
| Dominio         | `src/features/<dominio>`    | Reglas de negocio: catálogo, carrito, checkout, pedidos, auth | services, lib     |
| Integraciones   | `src/services/<tipo>`       | Adaptadores a proveedores externos detrás de interfaces       | lib               |
| Infraestructura | `src/lib`                   | `env` validado, cliente Prisma, formatos es-CO/COP            | —                 |

Reglas:

- Las dependencias van **hacia abajo**; un servicio nunca importa de `features` ni de `app`.
- Ningún SDK de proveedor (Wompi, Cloudinary, correo) se importa fuera de `src/services/`.
- El proveedor concreto se elige con variables de entorno (`PAYMENT_PROVIDER`,
  `STORAGE_PROVIDER`, `EMAIL_PROVIDER`): cambiar de proveedor es cambiar configuración, no código.

## Rutas (route groups)

- `(shop)`: `/`, catálogo, producto, carrito, checkout.
- `(auth)`: login y registro.
- `admin`: panel del dueño, protegido por rol `ADMIN` en el servidor.
- `api`: webhooks (Wompi) y endpoints.

## Modelo de datos

Fuente de verdad: [`prisma/schema.prisma`](../prisma/schema.prisma). Montos en COP como enteros.

```mermaid
erDiagram
  User ||--o| Cart : "tiene"
  User ||--o{ Order : "hace"
  Category ||--o{ Product : "agrupa"
  Product ||--|{ ProductVariant : "se vende como"
  Product ||--o{ ProductImage : "muestra"
  Cart ||--o{ CartItem : "contiene"
  ProductVariant ||--o{ CartItem : ""
  Order ||--|{ OrderItem : "incluye"
  ProductVariant |o--o{ OrderItem : ""
  Order ||--o{ Payment : "se paga con"
```

- **Variantes:** cada producto se vende en una o más variantes con precio propio (8 o 16 porciones, caja x6 o x12).
- **Invitados:** el carrito de un invitado se identifica con una cookie; el pedido guarda nombre, correo y teléfono, y `userId` es opcional.
- **Snapshot:** `OrderItem` copia nombre y precio al comprar; cambiar un producto no altera pedidos pasados.
- **Pagos:** un `Payment` por intento (Wompi exige una referencia única por transacción).
- **Entrega:** `DELIVERY` (con dirección y costo de envío) o `PICKUP`, con fecha de entrega.

> Este documento se amplía en cada paso (auth en el Paso 3…).
