import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

// ADMIN_EMAILS for the e2e server is set in playwright.config.ts.
const ADMIN_EMAIL = "owner@e2e.melange.test";
const TEST_DOMAIN = "e2e.melange.test";
loadEnvConfig(process.cwd());

// The admin tests use the same address: run them one after the other.
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

const run = Date.now();
const customerEmail = `recupera-${run}@${TEST_DOMAIN}`;
// Accounts that start with another address and are then renamed to the owner's (see below).
const impostorEmails = ["a", "b", "c"].map((id) => `impostor-${id}-${run}@${TEST_DOMAIN}`);

const octet = () => Math.floor(Math.random() * 254) + 1;
const randomIp = () => `10.${octet()}.${octet()}.${octet()}`;

test.afterAll(async () => {
  await sql(`DELETE FROM users WHERE email = ANY($1)`, [
    [ADMIN_EMAIL, customerEmail, ...impostorEmails],
  ]);
});

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
  await sql(`DELETE FROM users WHERE email = $1`, [ADMIN_EMAIL]);
});

async function signUp(page: Page, email: string, password: string) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Persona Prueba");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contraseña").fill(password);
  await page.getByLabel(/Autorizo el tratamiento/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

/** The token of the latest reset link emailed to this address (read from the database). */
async function latestResetToken(email: string) {
  const [row] = await sql<{ identifier: string }>(
    `SELECT v.identifier FROM verifications v JOIN users u ON u.id = v.value
     WHERE u.email = $1 AND v.identifier LIKE 'reset-password:%'
     ORDER BY v."createdAt" DESC LIMIT 1`,
    [email],
  );
  return row?.identifier.replace("reset-password:", "");
}

/** Requests a reset link and follows it, like the person who received the email. */
async function resetPassword(page: Page, email: string, newPassword: string) {
  await page.goto("/ingresar");
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
  await expect(page).toHaveURL(/\/olvide-contrasena$/);
  // Next keeps the sign-in page mounted (hidden) for a moment: use the visible field.
  await page.getByLabel("Correo").filter({ visible: true }).fill(email);
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByText("Si existe una cuenta con ese correo")).toBeVisible();

  const token = await latestResetToken(email);
  expect(token).toBeTruthy();

  // Same URL as in the email.
  await page.goto(`/restablecer?token=${token}`);
  await page.getByLabel("Contraseña nueva").fill(newPassword);
  await page.getByLabel("Confirmar contraseña").fill(newPassword);
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByText("Listo, tu contraseña cambió.")).toBeVisible();
}

/**
 * An account that already has a password and then turns out to carry the owner's address:
 * what is left when someone registered it before the address was listed in ADMIN_EMAILS.
 */
async function registerThenRenameToOwner(page: Page, email: string, password: string) {
  await signUp(page, email, password);
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await sql(`UPDATE users SET email = $1 WHERE email = $2`, [ADMIN_EMAIL, email]);
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

test("el correo de la dueña no se puede registrar por el formulario público", async ({ page }) => {
  await signUp(page, ADMIN_EMAIL, "clave-del-atacante");

  // Same answer as for any address that already has an account. What exists is an account
  // without credentials or sessions, waiting for the owner's link: the password typed here
  // was never stored.
  await expect(page.getByText("Ya existe una cuenta con ese correo.")).toBeVisible();
  const [account] = await sql<{ role: string; accounts: number; sessions: number }>(
    `SELECT u.role,
            (SELECT count(*)::int FROM accounts a WHERE a."userId" = u.id) AS accounts,
            (SELECT count(*)::int FROM sessions s WHERE s."userId" = u.id) AS sessions
     FROM users u WHERE u.email = $1`,
    [ADMIN_EMAIL],
  );
  expect(account).toEqual({ role: "CUSTOMER", accounts: 0, sessions: 0 });
  await signIn(page, ADMIN_EMAIL, "clave-del-atacante");
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("un enlace pedido antes de que el correo administrara la tienda no activa el panel", async ({
  page,
  baseURL,
}) => {
  // The account already had a password, and a reset link issued back then is still valid.
  await registerThenRenameToOwner(page, impostorEmails[2]!, "clave-del-atacante");
  const [{ id } = { id: "" }] = await sql<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [
    ADMIN_EMAIL,
  ]);
  const oldToken = `enlace-viejo-${run}`;
  await sql(
    `INSERT INTO verifications (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, now() + interval '1 hour', now(), now())`,
    [`e2e-${run}`, `reset-password:${oldToken}`, id],
  );

  const response = await page.request.post("/api/auth/reset-password", {
    headers: { origin: new URL(baseURL!).origin },
    data: { newPassword: "clave-de-quien-sea", token: oldToken },
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).code).toBe("INVALID_TOKEN");
  const [user] = await sql<{ role: string }>(`SELECT role FROM users WHERE email = $1`, [
    ADMIN_EMAIL,
  ]);
  expect(user?.role).toBe("CUSTOMER");

  // The page tells her to ask for a new link, and that one does work.
  await page.context().clearCookies();
  await page.goto(`/restablecer?token=${oldToken}`);
  await page.getByLabel("Contraseña nueva").fill("clave-de-la-duena");
  await page.getByLabel("Confirmar contraseña").fill("clave-de-la-duena");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByText("El enlace no es válido o ya venció. Pide uno nuevo.")).toBeVisible();

  await resetPassword(page, ADMIN_EMAIL, "clave-de-la-duena");
  await signIn(page, ADMIN_EMAIL, "clave-de-la-duena");
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Panel" })).toBeVisible();
  await sql(`DELETE FROM verifications WHERE id = $1`, [`e2e-${run}`]);
});

test("la dueña activa el panel creando su contraseña con el enlace del correo", async ({
  page,
}) => {
  // No account exists yet: "¿Olvidaste tu contraseña?" is her way in.
  await resetPassword(page, ADMIN_EMAIL, "clave-de-la-duena");

  const [user] = await sql<{ role: string; emailVerified: boolean }>(
    `SELECT role, "emailVerified" FROM users WHERE email = $1`,
    [ADMIN_EMAIL],
  );
  expect(user).toEqual({ role: "ADMIN", emailVerified: true });

  await signIn(page, ADMIN_EMAIL, "clave-de-la-duena");
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByRole("navigation", { name: "Panel" })).toBeVisible();
});

test("una cuenta creada antes con el correo de la dueña no conserva el acceso", async ({
  browser,
}) => {
  const impostor = await browser.newPage();
  await impostor.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
  await registerThenRenameToOwner(impostor, impostorEmails[0]!, "clave-del-atacante");

  // The owner proves her inbox and becomes ADMIN with her own password, on a new account.
  const owner = await browser.newPage();
  await owner.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
  await resetPassword(owner, ADMIN_EMAIL, "clave-de-la-duena");
  await signIn(owner, ADMIN_EMAIL, "clave-de-la-duena");
  await expect(owner.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await owner.goto("/admin");
  await expect(owner.getByRole("navigation", { name: "Panel" })).toBeVisible();

  // The earlier session is gone and its password never worked on the new account.
  await impostor.goto("/admin");
  await expect(impostor).toHaveURL(/\/ingresar/);
  await signIn(impostor, ADMIN_EMAIL, "clave-del-atacante");
  await expect(impostor.getByText("Correo o contraseña incorrectos.")).toBeVisible();

  await impostor.close();
  await owner.close();
});

test("ingresar justo mientras la dueña activa el panel no deja una sesión de administradora", async ({
  page,
  baseURL,
}) => {
  test.slow();
  const password = "clave-del-atacante";
  await registerThenRenameToOwner(page, impostorEmails[1]!, password);
  const firstSession = (await page.context().cookies())
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const post = async (path: string, body: unknown) => {
    const response = await fetch(`${baseURL}/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseURL!,
        "x-forwarded-for": randomIp(),
      },
      body: JSON.stringify(body),
    });
    await response.text();
    const cookies = response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]);
    return { status: response.status, cookies: cookies.join("; ") };
  };
  /** Sign-ins from many addresses, a few milliseconds apart, while `action` runs. */
  const hammerDuring = async (action: () => Promise<unknown>) => {
    const attempts: ReturnType<typeof post>[] = [];
    let running: Promise<unknown> | undefined;
    for (let i = 0; i < 25; i++) {
      if (i === 5) running = action();
      attempts.push(post("/sign-in/email", { email: ADMIN_EMAIL, password }));
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await running;
    return Promise.all(attempts);
  };

  // The owner asks for her link, then sets her password, with sign-ins racing both steps.
  const duringRequest = await hammerDuring(() =>
    post("/request-password-reset", { email: ADMIN_EMAIL, redirectTo: "/restablecer" }),
  );
  await expect.poll(() => latestResetToken(ADMIN_EMAIL)).toBeTruthy();
  const token = await latestResetToken(ADMIN_EMAIL);
  const duringReset = await hammerDuring(() =>
    post("/reset-password", { newPassword: "clave-de-la-duena", token }),
  );

  const [user] = await sql<{ role: string }>(`SELECT role FROM users WHERE email = $1`, [
    ADMIN_EMAIL,
  ]);
  expect(user?.role).toBe("ADMIN");

  // None of the cookies the impostor collected opens a session on the admin account.
  const collected = [...duringRequest, ...duringReset]
    .map((attempt) => attempt.cookies)
    .filter(Boolean);
  for (const cookie of [firstSession, ...collected]) {
    const response = await fetch(`${baseURL}/api/auth/get-session?disableCookieCache=true`, {
      headers: { cookie, "x-forwarded-for": randomIp() },
    });
    expect(await response.json()).toBeNull();
  }
  expect((await post("/sign-in/email", { email: ADMIN_EMAIL, password })).status).toBe(401);
  expect(
    (await post("/sign-in/email", { email: ADMIN_EMAIL, password: "clave-de-la-duena" })).status,
  ).toBe(200);
});
