import type { Metadata } from "next";
import Link from "next/link";

import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Términos y condiciones · Melange" };

export default function TermsPage() {
  return (
    <>
      <h1>Términos y condiciones</h1>
      <p className="text-sm text-zinc-500">Vigente desde: {BUSINESS.legalEffectiveDate}</p>

      <h2>1. Quién vende</h2>
      <p>
        {BUSINESS.tradeName} — {BUSINESS.legalName}, identificado con {BUSINESS.taxId}, con
        domicilio en {BUSINESS.address}. Contacto: {BUSINESS.email} · {BUSINESS.phone}.
      </p>

      <h2>2. Productos y precios</h2>
      <ul>
        <li>
          Los productos son de repostería elaborados por encargo. Las fotos son de referencia: el
          acabado puede variar levemente por ser hechos a mano.
        </li>
        <li>
          Los precios están en pesos colombianos (COP). [PENDIENTE: indicar si incluyen IVA o el
          impuesto que aplique.]
        </li>
        <li>
          El valor del domicilio depende de la zona y se muestra antes de confirmar el pedido.
        </li>
      </ul>

      <h2>3. Cómo se hace un pedido</h2>
      <ol>
        <li>Agregas productos al carrito y eliges domicilio o recogida en la sede.</li>
        <li>Eliges una fecha disponible y confirmas tus datos.</li>
        <li>
          El pedido queda registrado como pendiente. Lo confirmamos contigo por WhatsApp, donde
          acordamos la forma de pago. [PENDIENTE: actualizar cuando se habilite el pago en línea.]
        </li>
      </ol>
      <p>
        El pedido queda en firme cuando lo confirmamos. Si no podemos atender la fecha elegida, te
        lo informamos y puedes cambiarla o cancelar el pedido.
      </p>

      <h2>4. Entregas y recogidas</h2>
      <ul>
        <li>
          Entregamos en las zonas de Medellín y el área metropolitana publicadas en el checkout.
        </li>
        <li>
          Debe haber alguien para recibir el pedido en la dirección indicada. [PENDIENTE: franjas
          horarias y política si no hay quien reciba.]
        </li>
        <li>La recogida es en la sede: {BUSINESS.address}.</li>
      </ul>

      <h2>5. Cancelaciones</h2>
      <p>
        [PENDIENTE: definir hasta cuándo se puede cancelar sin costo, considerando que los productos
        se preparan con anticipación.]
      </p>

      <h2>6. Cambios, devoluciones y retracto</h2>
      <p>
        Consulta la{" "}
        <Link href="/legal/devoluciones" className="underline">
          política de cambios y devoluciones
        </Link>
        .
      </p>

      <h2>7. Datos personales</h2>
      <p>
        Tratamos tus datos según la{" "}
        <Link href="/legal/privacidad" className="underline">
          política de tratamiento de datos
        </Link>
        .
      </p>

      <h2>8. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de Colombia, en especial el Estatuto del Consumidor
        (Ley 1480 de 2011). Puedes presentar quejas ante la Superintendencia de Industria y
        Comercio.
      </p>
    </>
  );
}
