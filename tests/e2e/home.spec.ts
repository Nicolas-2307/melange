import { expect, test } from "@playwright/test";

test("la página de inicio muestra la marca", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Melange/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Melange");
});
