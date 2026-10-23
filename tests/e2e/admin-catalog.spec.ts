import { loadEnvConfig } from "@next/env";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

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
const email = `catalogo-${run}@${TEST_DOMAIN}`;
const categoryName = `Panes E2E ${run}`;
const productName = `Pan de prueba ${run}`;

test.afterAll(async () => {
  // Variants cascade with the product.
  await sql(`DELETE FROM products WHERE name = $1`, [productName]);
  await sql(`DELETE FROM categories WHERE name = $1`, [categoryName]);
  await sql(`DELETE FROM users WHERE email = $1`, [email]);
});

test.beforeEach(async ({ page }) => {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
});

async function signUpAsAdmin(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Dueña Catálogo");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-segura-123");
  await page.getByLabel("Confirmar contraseña").fill("clave-segura-123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await sql(`UPDATE users SET role = 'ADMIN' WHERE email = $1`, [email]);
}

test("la dueña crea categoría y producto, y los cambios se ven al instante en la tienda", async ({
  page,
}) => {
  await signUpAsAdmin(page);

  // New category
  await page.goto("/admin/categorias");
  const newCategory = page.getByRole("form", { name: "Nueva categoría" });
  await newCategory.getByLabel("Nombre").fill(categoryName);
  await newCategory.getByRole("button", { name: "Crear categoría" }).click();
  await expect(page.getByRole("form", { name: `Editar ${categoryName}` })).toBeVisible();

  // New product with two presentations
  await page.goto("/admin/productos/nuevo");
  await page.getByLabel("Nombre").fill(productName);
  await expect(page.getByLabel("Dirección en la tienda (slug)")).toHaveValue(
    `pan-de-prueba-${run}`,
  );
  await page.getByLabel("Descripción").fill("Pan artesanal de masa madre para pruebas.");
  await page.getByLabel("Categoría").selectOption({ label: categoryName });
  await page.getByLabel("Presentación", { exact: true }).fill("Unidad");
  await page.getByLabel("Precio (COP)").fill("12.000");
  await page.getByRole("button", { name: "+ Agregar presentación" }).click();
  await page.getByLabel("Presentación", { exact: true }).nth(1).fill("Media docena");
  await page.getByLabel("Precio (COP)").nth(1).fill("60000");
  await page.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByText("Producto creado.")).toBeVisible();

  // Visible in the store right away (catalog cache invalidated)
  await page.goto("/productos");
  await expect(page.getByRole("link", { name: new RegExp(productName) })).toBeVisible();
  await page.goto(`/productos/pan-de-prueba-${run}`);
  await expect(page.getByText("$ 12.000")).toBeVisible();

  // Edit the price
  await page.goto("/admin/productos");
  await page.getByRole("link", { name: productName }).filter({ visible: true }).click();
  await page.getByLabel("Precio (COP)").first().fill("15000");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible();
  await page.goto(`/productos/pan-de-prueba-${run}`);
  await expect(page.getByText("$ 15.000")).toBeVisible();

  // Hide it: it disappears from the store
  await page.goto("/admin/productos");
  await page
    .getByRole("row", { name: new RegExp(productName) })
    .getByRole("button", { name: /Visible/ })
    .click();
  await expect(
    page
      .getByRole("row", { name: new RegExp(productName) })
      .getByRole("button", { name: /Oculto/ }),
  ).toBeVisible();
  await page.goto("/productos");
  await expect(page.getByRole("link", { name: new RegExp(productName) })).toHaveCount(0);
});

test("crear productos exige ingresar como dueña", async ({ page }) => {
  await page.goto("/admin/productos/nuevo");
  // Not signed in: redirected to login (protected route).
  await expect(page).toHaveURL(/\/ingresar\?next=%2Fadmin%2Fproductos%2Fnuevo/);
});
