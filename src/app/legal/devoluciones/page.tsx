import type { Metadata } from "next";

import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Cambios y devoluciones · Melange" };

export default function ReturnsPage() {
  return (
    <>
      <h1>Cambios, devoluciones y derecho de retracto</h1>
      <p className="text-sm text-zinc-500">Vigente desde: {BUSINESS.legalEffectiveDate}</p>

      <h2>1. Derecho de retracto</h2>
      <p>
        El Estatuto del Consumidor (Ley 1480 de 2011, artículo 47) da derecho de retracto en las
        compras a distancia, con excepciones. Entre ellas están los bienes perecederos y los bienes
        elaborados según las especificaciones del consumidor. Por eso, en general, los productos de
        repostería —perecederos y preparados por encargo— no admiten retracto.
      </p>
      <p>
        [PENDIENTE: verificar con un abogado el texto vigente del artículo 47, modificado por la Ley
        2439 de 2024, y cómo aplica a cada producto.]
      </p>

      <h2>2. Productos en mal estado o diferentes a lo pedido (garantía)</h2>
      <p>
        Si tu pedido llega en mal estado, incompleto o diferente a lo que pediste, escríbenos a{" "}
        {BUSINESS.phone} o {BUSINESS.email} [PENDIENTE: plazo, por ejemplo «el mismo día de la
        entrega»] con fotos del producto. Revisaremos el caso y repondremos el producto o
        devolveremos el dinero, según corresponda.
      </p>

      <h2>3. Cancelaciones antes de la preparación</h2>
      <p>
        [PENDIENTE: condiciones para cancelar un pedido confirmado antes de que se prepare, y si se
        devuelve todo o parte del pago.]
      </p>

      <h2>4. Reversión del pago</h2>
      <p>
        Cuando se habilite el pago en línea, aplicarán las reglas de reversión del pago del artículo
        51 de la Ley 1480 de 2011 (por ejemplo, fraude, operación no solicitada o producto no
        recibido). [PENDIENTE: completar al activar Wompi.]
      </p>

      <h2>5. Cómo nos contactas</h2>
      <p>
        {BUSINESS.tradeName} · {BUSINESS.email} · {BUSINESS.phone}
      </p>
    </>
  );
}
