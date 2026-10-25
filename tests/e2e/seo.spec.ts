import { expect, test } from "@playwright/test";

// Relies on the sample catalog from prisma/seed.ts. The e2e server has no VERCEL_ENV, so it
// serves the production robots rules.

test("robots.txt bloquea las páginas privadas y apunta al sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain("Allow: /");
  for (const path of ["/admin", "/cuenta", "/checkout", "/pedidos/"]) {
    expect(body).toContain(`Disallow: ${path}`);
  }
  expect(body).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
});

test("sitemap.xml lista el catálogo con URLs absolutas", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toMatch(/<loc>https?:\/\/[^<]+\/productos\/torta-de-chocolate<\/loc>/);
  expect(body).toMatch(/<loc>https?:\/\/[^<]+\/categorias\/galletas<\/loc>/);
  expect(body).not.toContain("/admin");
});

test("el detalle de producto publica datos estructurados", async ({ page }) => {
  await page.goto("/productos/torta-de-chocolate");
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(json!);
  expect(data).toMatchObject({
    "@type": "Product",
    name: "Torta de chocolate",
    offers: { "@type": "AggregateOffer", lowPrice: 65000, highPrice: 120000, priceCurrency: "COP" },
  });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/productos\/torta-de-chocolate$/,
  );
});
