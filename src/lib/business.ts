/**
 * Legal and contact details of the business, shown in the footer and legal pages.
 *
 * ⚠️ PLACEHOLDERS: the owner hasn't provided this data yet (docs/datos-pendientes-propietaria.md).
 * Every value marked "[PENDIENTE]" must be replaced before launch.
 */
export const BUSINESS = {
  tradeName: "Melange",
  legalName: "[PENDIENTE: nombre o razón social]",
  taxId: "[PENDIENTE: NIT o cédula]",
  address: "[PENDIENTE: dirección], Parque de La Floresta, Medellín, Antioquia",
  email: "[PENDIENTE: correo de contacto]",
  phone: "[PENDIENTE: teléfono / WhatsApp]",
  /** Date the current legal texts take effect (shown on each legal page). */
  legalEffectiveDate: "[PENDIENTE: fecha de entrada en vigencia]",
} as const;

/** True while any business detail is still a placeholder (legal pages show a warning). */
export const BUSINESS_IS_PLACEHOLDER = Object.values(BUSINESS).some((value) =>
  value.includes("[PENDIENTE"),
);
