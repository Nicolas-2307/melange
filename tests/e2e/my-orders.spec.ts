import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

// Relies on prisma/seed.ts: sample catalog and store settings.
const TEST_DOMAIN = "e2e.melange.test";
loadEnvConfig(process.cwd());

const createdEmails: string[] = [];

test.afterAll(async () => {
  if (createdEmails.length === 0) return;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`DELETE FROM orders WHERE "customerEmail" = ANY($1)`, [createdEmails]);
  await client.query("DELETE FROM users WHERE email = ANY($1)", [createdEmails]);
  await client.end();
});

test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

function testEmail(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${TEST_DOMAIN}`;
  createdEmails.push(email);
  return email;
}

async function signUp(page: Page, name: string, email: string) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-segura-123");
  await page.getByLabel("Confirmar contraseña").fill("clave-segura-123");
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
}

/** Places a pickup order for one cake and returns its number. */
async function placePickupOrder(page: Page) {
  await page.goto("/productos/torta-de-chocolate");
  await page.getByText("16 porciones", { exact: true }).click();
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByText("Agregado al carrito.")).toBeVisible();
  await page.goto("/checkout");
  await page.getByLabel("Celular (WhatsApp)").fill("300 123 4567");
  await page.getByText("Recoger en la sede").click();
  const calendar = page.getByRole("group", { name: /Fecha de/ });
  await calendar.locator("button[aria-pressed]:not([disabled])").first().click();
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole("button", { name: "Hacer pedido" }).click();

  const heading = page.getByRole("heading", { name: /Pedido #\d+/ });
  await expect(heading).toBeVisible();
  return (await heading.textContent())!.match(/#(\d+)/)![1];
}

test("sin sesión, Mis pedidos lleva a ingresar", async ({ page }) => {
  await page.goto("/cuenta/pedidos");
  await expect(page).toHaveURL(/\/ingresar\?next=%2Fcuenta%2Fpedidos$/);
});

test("cada cliente ve solo sus pedidos", async ({ page }) => {
  await signUp(page, "Cliente Pedidos", testEmail("mis-pedidos"));
  const number = await placePickupOrder(page);

  await page.getByRole("link", { name: "Mis pedidos" }).click();
  await expect(page).toHaveURL(/\/cuenta\/pedidos$/);
  const order = page.getByRole("link", { name: new RegExp(`Pedido #${number}\\b`) });
  await expect(order).toBeVisible();
  await expect(order).toContainText("Recogida");
  await expect(order).toContainText("120.000");

  await order.click();
  await expect(page.getByRole("heading", { name: `Pedido #${number}` })).toBeVisible();

  // Another account must not see it.
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await signUp(page, "Otra Clienta", testEmail("otros-pedidos"));
  await page.goto("/cuenta/pedidos");
  await expect(page.getByText("Aún no tienes pedidos con esta cuenta.")).toBeVisible();
  await expect(page.getByText(`Pedido #${number}`)).toHaveCount(0);
});
