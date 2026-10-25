import type { Metadata } from "next";

import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = { title: "Política de tratamiento de datos · Melange" };

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Política de tratamiento de datos personales</h1>
      <p className="text-sm text-zinc-500">Vigente desde: {BUSINESS.legalEffectiveDate}</p>
      <p>
        Esta política explica cómo {BUSINESS.tradeName} recolecta, usa y protege tus datos
        personales, conforme a la Ley 1581 de 2012 y su reglamentación (Decreto 1377 de 2013,
        compilado en el Decreto 1074 de 2015).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>Nombre o razón social: {BUSINESS.legalName}</li>
        <li>NIT o cédula: {BUSINESS.taxId}</li>
        <li>Dirección: {BUSINESS.address}</li>
        <li>Correo: {BUSINESS.email}</li>
        <li>Teléfono / WhatsApp: {BUSINESS.phone}</li>
      </ul>

      <h2>2. Datos que recolectamos</h2>
      <ul>
        <li>Identificación y contacto: nombre, correo electrónico y celular.</li>
        <li>Entrega: dirección, zona y fecha de entrega o recogida, y notas del pedido.</li>
        <li>
          Cuenta (si te registras): correo y contraseña, guardada cifrada (nunca en texto plano).
        </li>
        <li>Pedidos: productos, valores y estado de cada pedido.</li>
        <li>Técnicos: dirección IP y cookies necesarias para la sesión y el carrito.</li>
      </ul>
      <p>No recolectamos datos sensibles ni datos de menores de edad de forma intencional.</p>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Recibir, preparar, entregar y cobrar tus pedidos.</li>
        <li>Comunicarnos contigo por WhatsApp, llamada o correo sobre tus pedidos.</li>
        <li>Crear y administrar tu cuenta, y enviarte correos de verificación y recuperación.</li>
        <li>Prevenir fraudes y abusos (por ejemplo, pedidos falsos o accesos indebidos).</li>
        <li>Cumplir obligaciones legales, contables y tributarias.</li>
        <li>
          [PENDIENTE: solo si la propietaria lo decide] Enviarte novedades y promociones, con tu
          autorización separada.
        </li>
      </ul>

      <h2>4. Encargados y transferencias</h2>
      <p>
        Para operar la tienda usamos proveedores que tratan datos por nuestra cuenta, algunos con
        servidores fuera de Colombia (principalmente Estados Unidos): alojamiento web, base de
        datos, envío de correos e imágenes y, cuando se habilite, la pasarela de pagos. Les exigimos
        medidas de seguridad y confidencialidad. [PENDIENTE: listar proveedores definitivos.]
      </p>

      <h2>5. Tus derechos</h2>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos.</li>
        <li>Solicitar prueba de la autorización que nos diste.</li>
        <li>Ser informado sobre el uso que les damos.</li>
        <li>
          Revocar la autorización o pedir que suprimamos tus datos, cuando no exista un deber legal
          o contractual de conservarlos.
        </li>
        <li>Acceder gratuitamente a tus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
      </ul>

      <h2>6. Cómo ejercer tus derechos</h2>
      <p>
        Escríbenos a {BUSINESS.email} indicando tu nombre, el correo o celular con el que compraste
        y tu solicitud. Respondemos las consultas en máximo diez (10) días hábiles y los reclamos en
        máximo quince (15) días hábiles, según la ley. [PENDIENTE: confirmar responsable de atender
        estas solicitudes.]
      </p>

      <h2>7. Seguridad y conservación</h2>
      <p>
        Usamos conexiones cifradas, contraseñas cifradas y accesos restringidos al panel de
        administración. Conservamos los datos mientras sean necesarios para las finalidades
        descritas y por los plazos que exijan las normas contables y tributarias.
      </p>

      <h2>8. Cambios a esta política</h2>
      <p>
        Si la modificamos de forma sustancial, lo informaremos en esta página antes de aplicar los
        cambios.
      </p>
    </>
  );
}
