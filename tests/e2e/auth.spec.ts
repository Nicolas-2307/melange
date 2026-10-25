import { loadEnvConfig } from "@next/env";
import { expect, test } from "@playwright/test";
import { Client } from "pg";

// Test users live in the dev database under this domain and are removed afterwards.
const TEST_DOMAIN = "e2e.melange.test";

loadEnvConfig(process.cwd());

// Tests run in parallel workers: each worker deletes only the users it created.
const createdEmails: string[] = [];

test.afterAll(async () => {
  if (createdEmails.length === 0) return;
  // Plain SQL: Playwright can't load the ESM Prisma client. Sessions and accounts cascade.
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("DELETE FROM users WHERE email = ANY($1)", [createdEmails]);
  await client.end();
});

// Auth endpoints are rate-limited per IP: give every test its own fake client IP.
test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

function newUser() {
  const email = `cliente-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@${TEST_DOMAIN}`;
  createdEmails.push(email);
  return { name: "Cliente Prueba", email, password: "clave-segura-123" };
}

test("un visitante sin sesión es enviado al login al abrir /admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/ingresar\?next=%2Fadmin/);
  await expect(page.getByRole("heading", { name: "Ingresar" })).toBeVisible();
});

test("registro, cierre de sesión e ingreso", async ({ page }) => {
  const user = newUser();

  await page.goto("/registro");
  await page.getByLabel("Nombre").fill(user.name);
  await page.getByLabel("Correo").fill(user.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
  await page.getByLabel("Confirmar contraseña").fill(user.password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText(`Hola, ${user.name}`)).toBeVisible();
  // A customer never sees the admin panel.
  await expect(page.getByRole("link", { name: "Panel" })).toHaveCount(0);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();

  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText(`Hola, ${user.name}`)).toBeVisible();
});

test("un cliente que abre /admin ve la página de no encontrado", async ({ page }) => {
  const user = newUser();
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill(user.name);
  await page.getByLabel("Correo").fill(user.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
  await page.getByLabel("Confirmar contraseña").fill(user.password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText(`Hola, ${user.name}`)).toBeVisible();

  // The check runs after the page starts streaming, so the HTTP status stays 200;
  // what matters is that the panel is never rendered.
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
  await expect(page.getByText("Panel del dueño")).toHaveCount(0);
});

test("muestra errores de validación y de credenciales", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Escribe un correo válido")).toBeVisible();

  await page.getByLabel("Correo").fill(`nadie@${TEST_DOMAIN}`);
  await page.getByLabel("Contraseña").fill("incorrecta-123");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});
