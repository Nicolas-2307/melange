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
  await page.getByLabel(/Autorizo el tratamiento/).check();
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
  await page.getByLabel(/Autorizo el tratamiento/).check();
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

test("tras ingresar, un destino manipulado no saca a la persona del sitio", async ({
  page,
  baseURL,
}) => {
  const user = newUser();
  // Answer for the outside host locally: the test must never leave the machine.
  await page.route(/^https?:\/\/example\.com\//, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<h1>sitio externo</h1>" }),
  );
  await page.request.post("/api/auth/sign-up/email", {
    headers: { origin: new URL(baseURL!).origin },
    data: { ...user, privacyAccepted: true },
  });
  await page.context().clearCookies();

  // "/.//example.com" resolves to "//example.com": another site for a browser.
  await page.goto(`/ingresar?next=${encodeURIComponent("/.//example.com/ingresar")}`);
  await page.getByLabel("Correo").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByText(`Hola, ${user.name}`)).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/");
  expect(new URL(page.url()).hostname).toBe("localhost");
});

test("la API de cuentas solo expone lo que usa la tienda", async ({ page, baseURL }) => {
  const user = newUser();
  const origin = new URL(baseURL!).origin;
  const signUp = await page.request.post("/api/auth/sign-up/email", {
    headers: { origin },
    data: { ...user, privacyAccepted: true },
  });
  expect(signUp.ok()).toBe(true);

  // With a valid session, none of these exist: a stolen session cannot rename the account,
  // change its password or keep itself alive through them.
  for (const path of ["/update-user", "/change-password", "/change-email", "/delete-user"]) {
    const response = await page.request.post(`/api/auth${path}`, {
      headers: { origin },
      data: { name: "Otro Nombre" },
    });
    expect(response.status(), path).toBe(404);
  }
  expect((await page.request.get("/api/auth/list-sessions")).status()).toBe(404);
});

test("el servidor valida el nombre aunque se llame a la API directamente", async ({
  page,
  baseURL,
}) => {
  const user = newUser();
  const response = await page.request.post("/api/auth/sign-up/email", {
    headers: { origin: new URL(baseURL!).origin },
    data: {
      ...user,
      name: `Gana un premio en https://evil.example\n${"x".repeat(3000)}`,
      privacyAccepted: true,
    },
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).code).toBe("INVALID_NAME");
});
