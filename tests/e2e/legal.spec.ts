import { expect, test } from "@playwright/test";

test("el pie de página lleva a las páginas legales", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await footer.getByRole("link", { name: "Tratamiento de datos personales" }).click();
  await expect(
    page.getByRole("heading", { name: "Política de tratamiento de datos personales" }),
  ).toBeVisible();
  await expect(page.getByText("Ley 1581 de 2012").first()).toBeVisible();

  await page.goto("/legal/terminos");
  await expect(
    page.getByRole("heading", { name: "Términos y condiciones", level: 1 }),
  ).toBeVisible();
  await page.goto("/legal/devoluciones");
  await expect(
    page.getByRole("heading", { name: "Cambios, devoluciones y derecho de retracto" }),
  ).toBeVisible();
});

test("crear una cuenta exige autorizar el tratamiento de datos", async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });

  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Sin Autorización");
  await page.getByLabel("Correo").fill(`sin-autorizacion-${Date.now()}@e2e.melange.test`);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-segura-123");
  await page.getByLabel("Confirmar contraseña").fill("clave-segura-123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(
    page.getByText("Debes autorizar el tratamiento de tus datos para continuar"),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/registro/);
});
