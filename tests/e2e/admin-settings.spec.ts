import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

// Store-wide settings are shared by tests running in parallel: this file never changes them,
// it only creates (and removes) its own delivery zone.
const TEST_DOMAIN = "e2e.melange.test";
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

const run = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
const emailFor = (name: string) => `config-${name}-${run}@${TEST_DOMAIN}`;
const zoneName = `Zona E2E ${run}`;

test.afterAll(async () => {
  await sql(`DELETE FROM delivery_zones WHERE name LIKE $1`, [`${zoneName}%`]);
  await sql(`DELETE FROM users WHERE email LIKE $1`, [`config-%-${run}@${TEST_DOMAIN}`]);
});

test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

async function signUpAsAdmin(page: Page, email: string) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Dueña Config");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-segura-123");
  await page.getByLabel("Confirmar contraseña").fill("clave-segura-123");
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await sql(`UPDATE users SET role = 'ADMIN' WHERE email = $1`, [email]);
}

test("la dueña crea, edita y elimina una zona, y el checkout lo refleja", async ({ page }) => {
  await signUpAsAdmin(page, emailFor("zonas"));

  await page.goto("/admin/configuracion");
  const newZone = page.getByRole("form", { name: "Nueva zona" });
  await newZone.getByLabel("Zona").fill(zoneName);
  await newZone.getByLabel("Domicilio (COP)").fill("7.500");
  await newZone.getByRole("button", { name: "Agregar zona" }).click();
  const zone = page.getByRole("form", { name: `Zona ${zoneName}` });
  await expect(zone).toBeVisible();

  // The checkout lists it with its fee
  await page.goto("/productos/brownie");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByText("Agregado al carrito.")).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("option", { name: `${zoneName} · $ 7.500` })).toBeAttached();

  // Edit the fee
  await page.goto("/admin/configuracion");
  await zone.getByLabel("Domicilio (COP)").fill("9000");
  await zone.getByRole("button", { name: "Guardar" }).click();
  await expect(zone.getByText("Guardado.")).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("option", { name: `${zoneName} · $ 9.000` })).toBeAttached();

  // Delete it
  await page.goto("/admin/configuracion");
  page.once("dialog", (dialog) => dialog.accept());
  await zone.getByRole("button", { name: "Eliminar" }).click();
  await expect(zone).toHaveCount(0);
  await page.goto("/checkout");
  await expect(page.getByRole("option", { name: new RegExp(zoneName) })).toHaveCount(0);
});

test("la disponibilidad exige al menos un día de trabajo", async ({ page }) => {
  await signUpAsAdmin(page, emailFor("dias"));

  await page.goto("/admin/configuracion");
  const form = page.getByRole("form", { name: "Disponibilidad y sede" });
  // Uncheck every weekday (does not save: validation fails before writing anything)
  for (const label of ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]) {
    const checkbox = form.getByRole("checkbox", { name: label });
    if (await checkbox.isChecked()) await form.getByText(label, { exact: true }).click();
  }
  await form.getByRole("button", { name: "Guardar disponibilidad" }).click();
  await expect(form.getByText("Elige al menos un día de trabajo")).toBeVisible();
});
