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

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `duena-${unique()}@${TEST_DOMAIN}`;
// The replay test runs in parallel with the first one: it gets its own accounts and day.
const replayAdminEmail = `duena-replay-${unique()}@${TEST_DOMAIN}`;
const replayCustomerEmail = `cliente-replay-${unique()}@${TEST_DOMAIN}`;
const REPLAY_REASON = `e2e-replay-${unique()}`;

test.afterAll(async () => {
  await sql(`DELETE FROM orders WHERE "customerEmail" = $1`, [email]);
  await sql(`DELETE FROM users WHERE email = ANY($1)`, [
    [email, replayAdminEmail, replayCustomerEmail],
  ]);
  await sql(`DELETE FROM blocked_dates WHERE reason = ANY($1)`, [[BLOCK_REASON, REPLAY_REASON]]);
});

test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

// Next keeps previously visited pages mounted but hidden, so match visible elements only.
const visibleText = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true });

/** Signs up and promotes the account to ADMIN directly in the database (no email inbox in tests). */
async function signUpAsAdmin(page: Page, address = email) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Dueña Prueba");
  await page.getByLabel("Correo").fill(address);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-segura-123");
  await page.getByLabel("Confirmar contraseña").fill("clave-segura-123");
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await sql(`UPDATE users SET role = 'ADMIN' WHERE email = $1`, [address]);
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
  await page.getByLabel(/Autorizo el tratamiento/).check();
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
  // Wait for the list itself: the dashboard also links this order and Next keeps it mounted
  // (hidden) for a moment after navigating, so clicking too early can target that copy.
  await expect(page).toHaveURL(/\/admin\/pedidos$/);
  const ordersList = page.getByRole("navigation", { name: "Filtrar pedidos" });
  await expect(ordersList).toBeVisible();
  await page.getByRole("link", { name: orderNumber }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/admin\/pedidos\/[\w-]+$/);

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

  // Block a far-away day, then unblock it. Never block days near today: checkout tests
  // running in parallel pick the first available date.
  const far = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await page.goto(`/admin/calendario?mes=${far.slice(0, 7)}&dia=${far}`);
  await page.getByLabel("Motivo (opcional)").fill(BLOCK_REASON);
  await page.getByRole("button", { name: "Bloquear día" }).click();
  await expect(page.getByText("Este día está")).toBeVisible();
  await page.getByRole("button", { name: "Desbloquear día" }).click();
  await expect(page.getByRole("button", { name: "Bloquear día" })).toBeVisible();
});

test("sin sesión, el calendario del panel envía a ingresar", async ({ page }) => {
  await page.goto("/admin/calendario");
  await expect(page).toHaveURL(/\/ingresar\?next=%2Fadmin%2Fcalendario/);
});

test("repetir una acción del panel sin ser la dueña no surte efecto", async ({
  page,
  browser,
  baseURL,
}) => {
  await signUpAsAdmin(page, replayAdminEmail);

  // Record the real request the panel sends when the owner blocks a day.
  type Recorded = { url: string; headers: Record<string, string>; body: string };
  const recorded: Recorded[] = [];
  page.on("request", (request) => {
    const headers = request.headers();
    if (request.method() === "POST" && headers["next-action"]) {
      recorded.push({ url: request.url(), headers, body: request.postData() ?? "" });
    }
  });
  const far = new Date(Date.now() + 61 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await page.goto(`/admin/calendario?mes=${far.slice(0, 7)}&dia=${far}`);
  await page.getByLabel("Motivo (opcional)").fill(REPLAY_REASON);
  await page.getByRole("button", { name: "Bloquear día" }).click();
  await expect(page.getByText("Este día está")).toBeVisible();
  await page.getByRole("button", { name: "Desbloquear día" }).click();
  await expect(page.getByRole("button", { name: "Bloquear día" })).toBeVisible();
  const blockDay = recorded.find((request) => request.body.includes(REPLAY_REASON));
  expect(blockDay, "the block-day action was recorded").toBeTruthy();

  const customer = await browser.newContext();
  await customer.request.post("/api/auth/sign-up/email", {
    headers: { origin: baseURL!, "x-forwarded-for": "10.201.0.9" },
    data: {
      name: "Cliente Curioso",
      email: replayCustomerEmail,
      password: "clave-segura-123",
      privacyAccepted: true,
    },
  });
  const cookieHeader = async (context: typeof customer) =>
    (await context.cookies()).map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

  const replay = async (cookie: string | null, origin = baseURL!) => {
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(blockDay!.headers)) {
      const skip = ["cookie", "content-length", "host", "connection", "origin", "referer"];
      if (!name.startsWith(":") && !skip.includes(name)) headers[name] = value;
    }
    const response = await fetch(blockDay!.url, {
      method: "POST",
      redirect: "manual",
      headers: { ...headers, origin, ...(cookie ? { cookie } : {}) },
      body: blockDay!.body,
    });
    await response.text();
  };
  const dayIsBlocked = async () =>
    (await sql(`SELECT 1 FROM blocked_dates WHERE reason = $1`, [REPLAY_REASON])).rowCount === 1;

  await replay(null);
  expect(await dayIsBlocked(), "without a session").toBe(false);
  await replay(await cookieHeader(customer));
  expect(await dayIsBlocked(), "as a customer").toBe(false);
  await replay(await cookieHeader(page.context()), "https://evil.example");
  expect(await dayIsBlocked(), "owner's cookies sent from another site").toBe(false);

  // The same request does work for the owner: the checks above are not passing by accident.
  await replay(await cookieHeader(page.context()));
  expect(await dayIsBlocked(), "as the owner").toBe(true);

  await customer.close();
});
