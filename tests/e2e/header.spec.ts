import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

const TEST_DOMAIN = "e2e.melange.test";
loadEnvConfig(process.cwd());

const createdEmails: string[] = [];

async function sql(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await client.query(query, params);
  } finally {
    await client.end();
  }
}

test.afterAll(async () => {
  if (createdEmails.length > 0) {
    await sql("DELETE FROM users WHERE email = ANY($1)", [createdEmails]);
  }
});

// The narrowest phones still in use (iPhone SE, small Androids).
test.use({ viewport: { width: 320, height: 640 } });

test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

function newEmail(prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${TEST_DOMAIN}`;
  createdEmails.push(email);
  return email;
}

const PASSWORD = "clave-segura-123";

async function signUp(page: Page, email: string) {
  await page.goto("/registro");
  // A long name must not push the header wider than the screen either.
  await page.getByLabel("Nombre").fill("María Fernanda de los Ángeles Restrepo");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar contraseña").fill(PASSWORD);
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("button", { name: "Cuenta", exact: true })).toBeVisible();
}

/** How many pixels the page is wider than the screen (0 = no horizontal scroll). */
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test("en un celular, la clienta con sesión usa el menú Cuenta y nada se desborda", async ({
  page,
}) => {
  await signUp(page, newEmail("movil"));

  for (const path of ["/", "/productos", "/carrito"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: "Cuenta", exact: true })).toBeVisible();
    expect(await overflow(page), path).toBeLessThanOrEqual(0);
  }

  await page.getByRole("button", { name: "Cuenta", exact: true }).click();
  await expect(page.locator("#account-menu").getByText("Hola, María Fernanda")).toBeVisible();
  await expect(page.getByRole("link", { name: "Panel" })).toHaveCount(0);
  expect(await overflow(page)).toBeLessThanOrEqual(0);

  // Using a link closes the menu (the header stays mounted between pages).
  await page.getByRole("link", { name: "Mis pedidos" }).click();
  await expect(page).toHaveURL(/\/cuenta\/pedidos$/);
  await expect(page.getByRole("link", { name: "Mis pedidos" })).toHaveCount(0);

  await page.getByRole("button", { name: "Cuenta", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
});

test("en un celular, la dueña llega al panel desde el menú Cuenta sin desbordes", async ({
  page,
}) => {
  const email = newEmail("movil-duena");
  await signUp(page, email);
  await sql(`UPDATE users SET role = 'ADMIN' WHERE email = $1`, [email]);

  // The header reads the role from the session cookie: sign in again to refresh it.
  await page.getByRole("button", { name: "Cuenta", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("button", { name: "Cuenta", exact: true })).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: "Cuenta", exact: true }).click();
  await page.getByRole("link", { name: "Panel" }).click();
  await expect(page.getByRole("navigation", { name: "Panel" })).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
});
