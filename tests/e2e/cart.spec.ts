import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

// Relies on the sample catalog from prisma/seed.ts.
const TEST_DOMAIN = "e2e.melange.test";
loadEnvConfig(process.cwd());

const createdEmails: string[] = [];

test.afterAll(async () => {
  if (createdEmails.length === 0) return;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  // Deleting the user cascades to its cart. Guest carts from these tests are left behind,
  // like any abandoned guest cart (a cleanup job is planned for later).
  await client.query("DELETE FROM users WHERE email = ANY($1)", [createdEmails]);
  await client.end();
});

test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

async function addProduct(page: Page, slug: string, variant?: string) {
  await page.goto(`/productos/${slug}`);
  if (variant) await page.getByText(variant, { exact: true }).click();
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByText("Agregado al carrito.")).toBeVisible();
}

const cartCount = (page: Page) => page.getByTestId("cart-count");
const subtotal = (page: Page) => page.getByTestId("cart-subtotal");

test("agregar, cambiar cantidad y eliminar del carrito", async ({ page }) => {
  await addProduct(page, "torta-de-chocolate", "16 porciones");
  await expect(cartCount(page)).toHaveText("1");

  await addProduct(page, "brownie");
  await expect(cartCount(page)).toHaveText("2");

  await page.goto("/carrito");
  await expect(page.getByRole("link", { name: "Torta de chocolate", exact: true })).toBeVisible();
  await expect(subtotal(page)).toHaveText(/126\.500/); // 120.000 + 6.500

  await page
    .getByRole("group", { name: "Cantidad de Brownie" })
    .getByLabel("Agregar una unidad")
    .click();
  await expect(subtotal(page)).toHaveText(/133\.000/); // 120.000 + 2 × 6.500
  await expect(cartCount(page)).toHaveText("3");

  await page
    .getByRole("listitem")
    .filter({ hasText: "Torta de chocolate" })
    .getByRole("button", { name: "Eliminar" })
    .click();
  await expect(page.getByRole("link", { name: "Torta de chocolate", exact: true })).toHaveCount(0);
  await expect(subtotal(page)).toHaveText(/13\.000/);
});

test("el carrito vacío invita a ver productos", async ({ page }) => {
  await page.goto("/carrito");
  await expect(page.getByText("Tu carrito está vacío.")).toBeVisible();
  await expect(cartCount(page)).toHaveText("0");
});

test("el carrito de invitado se conserva al crear una cuenta", async ({ page }) => {
  await addProduct(page, "galletas-chips-de-chocolate", "Caja x12");
  await expect(cartCount(page)).toHaveText("1");

  const email = `carrito-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${TEST_DOMAIN}`;
  createdEmails.push(email);
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Cliente Carrito");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-segura-123");
  await page.getByLabel("Confirmar contraseña").fill("clave-segura-123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Hola, Cliente Carrito")).toBeVisible();

  await expect(cartCount(page)).toHaveText("1");
  await page.goto("/carrito");
  await expect(page.getByText("Caja x12", { exact: false })).toBeVisible();
});
