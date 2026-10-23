import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

// Relies on prisma/seed.ts: sample catalog, delivery zones and store settings.
const TEST_DOMAIN = "e2e.melange.test";
loadEnvConfig(process.cwd());

const createdEmails: string[] = [];

test.afterAll(async () => {
  if (createdEmails.length === 0) return;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  // Items and payments cascade with the order.
  await client.query(`DELETE FROM orders WHERE "customerEmail" = ANY($1)`, [createdEmails]);
  await client.end();
});

test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

function testEmail() {
  const email = `pedido-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${TEST_DOMAIN}`;
  createdEmails.push(email);
  return email;
}

async function addCakeAndGoToCheckout(page: Page) {
  await page.goto("/productos/torta-de-chocolate");
  await page.getByText("16 porciones", { exact: true }).click();
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByText("Agregado al carrito.")).toBeVisible();
  await page.goto("/carrito");
  await page.getByRole("link", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Finalizar pedido" })).toBeVisible();
}

async function fillContact(page: Page, email: string) {
  await page.getByLabel("Nombre").fill("Cliente Pedido");
  await page.getByLabel("Celular (WhatsApp)").fill("300 123 4567");
  await page.getByLabel("Correo").fill(email);
}

/** Clicks the first available day in the delivery calendar. */
async function pickFirstDate(page: Page) {
  const calendar = page.getByRole("group", { name: /Fecha de/ });
  await calendar.locator("button[aria-pressed]:not([disabled])").first().click();
  await expect(page.getByText("Elegiste:")).toBeVisible();
}

test("pedido a domicilio: valida, calcula el total y lleva a WhatsApp", async ({ page }) => {
  await addCakeAndGoToCheckout(page);

  await page.getByRole("button", { name: "Hacer pedido" }).click();
  await expect(page.getByText("Escribe tu nombre")).toBeVisible();
  await expect(page.locator("p", { hasText: "Elige tu zona" })).toBeVisible();
  await expect(page.getByText("Elige una fecha")).toBeVisible();

  await fillContact(page, testEmail());
  await page
    .getByLabel("Zona")
    .selectOption({ label: "La Floresta, La América, Calasanz · $ 5.000" });
  await page.getByLabel("Dirección").fill("Carrera 80 # 45-10, apto 301");
  await pickFirstDate(page);
  await page.getByLabel("Notas (opcional)").fill("Feliz cumpleaños");
  await expect(page.getByTestId("checkout-total")).toHaveText(/125\.000/); // 120.000 + 5.000

  await page.getByRole("button", { name: "Hacer pedido" }).click();

  await expect(page).toHaveURL(/\/pedidos\/[\w-]+$/);
  await expect(page.getByRole("heading", { name: /Pedido #\d+/ })).toBeVisible();
  await expect(page.getByTestId("order-total")).toHaveText(/125\.000/);
  const whatsapp = page.getByRole("link", { name: "Enviar pedido por WhatsApp" });
  await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);
  await expect(page.getByTestId("cart-count")).toHaveText("0");
});

test("pedido para recoger en la sede no cobra domicilio", async ({ page }) => {
  await addCakeAndGoToCheckout(page);
  await fillContact(page, testEmail());
  await page.getByText("Recoger en la sede").click();
  await expect(page.getByText("Parque de La Floresta")).toBeVisible();
  await pickFirstDate(page);
  await expect(page.getByTestId("checkout-total")).toHaveText(/120\.000/);

  await page.getByRole("button", { name: "Hacer pedido" }).click();
  await expect(page.getByRole("heading", { name: "Recogida" })).toBeVisible();
  await expect(page.getByTestId("order-total")).toHaveText(/120\.000/);
});

test("el calendario no deja elegir días no disponibles", async ({ page }) => {
  await addCakeAndGoToCheckout(page);
  const calendar = page.getByRole("group", { name: "Fecha de entrega" });
  // Today is never selectable (minimum lead time is at least 1 day in the seed).
  await expect(calendar.getByRole("button", { name: /no disponible/ }).first()).toBeDisabled();
  await expect(calendar.locator("button[aria-pressed]:not([disabled])").first()).toBeVisible();
});

test("con el carrito vacío el checkout vuelve al carrito", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/carrito$/);
});

test("un enlace de pedido inventado muestra no encontrado", async ({ page }) => {
  await page.goto("/pedidos/token-que-no-existe-123456789");
  await expect(page.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
});
