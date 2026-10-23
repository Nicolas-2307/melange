import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

// Relies on prisma/seed.ts (catalog, zones, store settings).
const TEST_DOMAIN = "e2e.melange.test";
const BLOCK_REASON = "e2e-admin";
loadEnvConfig(process.cwd());

async function sql(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await client.query(query, params);
  } finally {
    await client.end();
  }
}

const email = `duena-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${TEST_DOMAIN}`;

test.afterAll(async () => {
  await sql(`DELETE FROM orders WHERE "customerEmail" = $1`, [email]);
  await sql(`DELETE FROM users WHERE email = $1`, [email]);
  await sql(`DELETE FROM blocked_dates WHERE reason = $1`, [BLOCK_REASON]);
});

test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

// Next keeps previously visited pages mounted but hidden, so match visible elements only.
const visibleText = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true });

/** Signs up and promotes the account to ADMIN directly in the database (no email inbox in tests). */
async function signUpAsAdmin(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Dueña Prueba");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-segura-123");
  await page.getByLabel("Confirmar contraseña").fill("clave-segura-123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await sql(`UPDATE users SET role = 'ADMIN' WHERE email = $1`, [email]);
}

async function placePickupOrder(page: Page): Promise<string> {
  await page.goto("/productos/brownie");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByText("Agregado al carrito.")).toBeVisible();
  await page.goto("/checkout");
  await page.getByLabel("Celular (WhatsApp)").fill("3001234567");
  await page.getByText("Recoger en la sede").click();
  await page
    .getByRole("group", { name: /Fecha de/ })
    .locator("button[aria-pressed]:not([disabled])")
    .first()
    .click();
  await page.getByRole("button", { name: "Hacer pedido" }).click();
  const heading = page.getByRole("heading", { name: /Pedido #\d+/ });
  await expect(heading).toBeVisible();
  return (await heading.textContent())!.replace("Pedido ", "");
}

test("la dueña gestiona un pedido y bloquea un día en su calendario", async ({ page }) => {
  await signUpAsAdmin(page);
  const orderNumber = await placePickupOrder(page);

  // Dashboard and list
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Panel" })).toBeVisible();
  await page.getByRole("link", { name: "Pedidos", exact: true }).click();
  // Next keeps the previous page (dashboard, which also lists this order) mounted but hidden.
  await page.getByRole("link", { name: orderNumber }).filter({ visible: true }).click();

  // Detail: confirm, register payment, prepare
  await expect(page.getByRole("heading", { name: `Pedido ${orderNumber}` })).toBeVisible();
  await expect(visibleText(page, "Pendiente de confirmación")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(visibleText(page, "Confirmado")).toBeVisible();
  await page.getByRole("button", { name: "Registrar pago recibido" }).click();
  await expect(visibleText(page, "Recibido")).toBeVisible();
  await page.getByRole("button", { name: "Empezar preparación" }).click();
  await expect(visibleText(page, "En preparación")).toBeVisible();

  // Calendar: the delivery date link opens that day with the order listed
  await page
    .getByRole("link", { name: /^(lunes|martes|miércoles|jueves|viernes|sábado|domingo),/ })
    .click();
  await expect(page).toHaveURL(/\/admin\/calendario\?mes=\d{4}-\d{2}&dia=\d{4}-\d{2}-\d{2}$/);
  await expect(
    page.getByRole("link", { name: orderNumber }).filter({ visible: true }),
  ).toBeVisible();

  // Block that day for new orders, then unblock it
  await page.getByLabel("Motivo (opcional)").fill(BLOCK_REASON);
  await page.getByRole("button", { name: "Bloquear día" }).click();
  await expect(page.getByText("Este día está")).toBeVisible();
  await page.getByRole("button", { name: "Desbloquear día" }).click();
  await expect(page.getByRole("button", { name: "Bloquear día" })).toBeVisible();
});

test("un cliente no puede usar las acciones del panel", async ({ page }) => {
  // Visiting the panel without the ADMIN role shows "not found" (covered in auth.spec.ts);
  // here we check the calendar route is protected too.
  await page.goto("/admin/calendario");
  await expect(page).toHaveURL(/\/ingresar\?next=%2Fadmin%2Fcalendario/);
});
