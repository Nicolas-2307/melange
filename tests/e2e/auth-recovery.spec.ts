import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

// ADMIN_EMAILS for the e2e server is set in playwright.config.ts.
const ADMIN_EMAIL = "owner@e2e.melange.test";
const TEST_DOMAIN = "e2e.melange.test";
loadEnvConfig(process.cwd());

// Both tests use the same admin address: run them one after the other.
test.describe.configure({ mode: "serial" });

async function sql<T extends Record<string, unknown>>(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return (await client.query<T>(query, params)).rows;
  } finally {
    await client.end();
  }
}

const customerEmail = `recupera-${Date.now()}@${TEST_DOMAIN}`;

test.afterAll(async () => {
  await sql(`DELETE FROM users WHERE email = ANY($1)`, [[ADMIN_EMAIL, customerEmail]]);
});

test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

async function signUp(page: Page, email: string, password: string) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Persona Prueba");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contraseña").fill(password);
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

/** Requests a reset link and follows it. The emailed token is read from the database. */
async function resetPassword(page: Page, email: string, newPassword: string) {
  await page.goto("/ingresar");
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
  await expect(page).toHaveURL(/\/olvide-contrasena$/);
  // Next keeps the sign-in page mounted (hidden) for a moment: use the visible field.
  await page.getByLabel("Correo").filter({ visible: true }).fill(email);
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByText("Si existe una cuenta con ese correo")).toBeVisible();

  const [row] = await sql<{ identifier: string }>(
    `SELECT v.identifier FROM verifications v JOIN users u ON u.id = v.value
     WHERE u.email = $1 AND v.identifier LIKE 'reset-password:%'
     ORDER BY v."createdAt" DESC LIMIT 1`,
    [email],
  );
  const token = row!.identifier.replace("reset-password:", "");

  // Same URL as in the email: Better Auth validates the token and redirects to /restablecer.
  await page.goto(
    `/api/auth/reset-password/${token}?callbackURL=${encodeURIComponent("/restablecer")}`,
  );
  await expect(page).toHaveURL(/\/restablecer\?token=/);
  await page.getByLabel("Contraseña nueva").fill(newPassword);
  await page.getByLabel("Confirmar contraseña").fill(newPassword);
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByText("Listo, tu contraseña cambió.")).toBeVisible();
}

test("un cliente recupera su contraseña con el enlace del correo", async ({ page }) => {
  await signUp(page, customerEmail, "clave-original-123");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  await resetPassword(page, customerEmail, "clave-nueva-456");

  await signIn(page, customerEmail, "clave-original-123");
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  await signIn(page, customerEmail, "clave-nueva-456");
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
});

test("quien registra primero el correo de la dueña no se queda con el panel", async ({
  browser,
}) => {
  // The attacker registers the owner's address first and stays signed in.
  const attacker = await browser.newPage();
  await attacker.setExtraHTTPHeaders({ "x-forwarded-for": "10.200.0.1" });
  await signUp(attacker, ADMIN_EMAIL, "clave-del-atacante");
  const roleBefore = await sql<{ role: string }>(`SELECT role FROM users WHERE email = $1`, [
    ADMIN_EMAIL,
  ]);
  expect(roleBefore[0]?.role).toBe("CUSTOMER");

  // The owner proves her inbox (reset link) and becomes ADMIN with her own password.
  const owner = await browser.newPage();
  await owner.setExtraHTTPHeaders({ "x-forwarded-for": "10.200.0.2" });
  await resetPassword(owner, ADMIN_EMAIL, "clave-de-la-duena");
  await signIn(owner, ADMIN_EMAIL, "clave-de-la-duena");
  await expect(owner.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await owner.goto("/admin");
  await expect(owner.getByRole("navigation", { name: "Panel" })).toBeVisible();

  // The attacker's session was closed and his password no longer works.
  await attacker.goto("/admin");
  await expect(attacker).toHaveURL(/\/ingresar/);
  await signIn(attacker, ADMIN_EMAIL, "clave-del-atacante");
  await expect(attacker.getByText("Correo o contraseña incorrectos.")).toBeVisible();

  await attacker.close();
  await owner.close();
});
