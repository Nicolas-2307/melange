import { expect, test } from "@playwright/test";

// Relies on the sample catalog from prisma/seed.ts.

test("la página de inicio muestra destacados y lleva al catálogo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Destacados" })).toBeVisible();
  await page.getByRole("link", { name: "Ver productos" }).click();
  await expect(page.getByRole("heading", { name: "Productos", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Torta de chocolate/ })).toBeVisible();
});

test("filtrar por categoría muestra solo sus productos", async ({ page }) => {
  await page.goto("/productos");
  await page
    .getByRole("navigation", { name: "Categorías" })
    .getByRole("link", { name: "Galletas" })
    .click();
  await expect(page.getByRole("heading", { name: "Galletas", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Galletas con chips de chocolate/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Torta de chocolate/ })).toHaveCount(0);
});

test("el detalle cambia el precio al elegir otra presentación", async ({ page }) => {
  await page.goto("/productos/torta-de-chocolate");
  await expect(page.getByRole("heading", { name: "Torta de chocolate" })).toBeVisible();
  await expect(page.getByText("$ 65.000")).toBeVisible();
  await page.getByText("16 porciones").click();
  await expect(page.getByText("$ 120.000")).toBeVisible();
});

test("un producto inexistente muestra la página de no encontrado", async ({ page }) => {
  await page.goto("/productos/no-existe");
  await expect(page.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
});
