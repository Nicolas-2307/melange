/**
 * Sample catalog for development. Idempotent: run it as many times as you want
 * (`npm run db:seed`); it upserts by slug/sku and never deletes data.
 */
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  isFeatured?: boolean;
  variants: { name: string; sku: string; price: number }[];
};

const catalog: { name: string; slug: string; description: string; products: SeedProduct[] }[] = [
  {
    name: "Tortas",
    slug: "tortas",
    description: "Tortas para celebrar, hechas por encargo.",
    products: [
      {
        name: "Torta de chocolate",
        slug: "torta-de-chocolate",
        description: "Bizcocho húmedo de chocolate con ganache de chocolate semiamargo.",
        isFeatured: true,
        variants: [
          { name: "8 porciones", sku: "TOR-CHOC-8", price: 65000 },
          { name: "16 porciones", sku: "TOR-CHOC-16", price: 120000 },
        ],
      },
      {
        name: "Torta de zanahoria",
        slug: "torta-de-zanahoria",
        description: "Con nueces, canela y frosting de queso crema.",
        variants: [
          { name: "8 porciones", sku: "TOR-ZAN-8", price: 60000 },
          { name: "16 porciones", sku: "TOR-ZAN-16", price: 110000 },
        ],
      },
      {
        name: "Cheesecake de maracuyá",
        slug: "cheesecake-de-maracuya",
        description: "Base de galleta, crema de queso horneada y salsa de maracuyá.",
        isFeatured: true,
        variants: [
          { name: "8 porciones", sku: "CHE-MAR-8", price: 70000 },
          { name: "12 porciones", sku: "CHE-MAR-12", price: 98000 },
        ],
      },
    ],
  },
  {
    name: "Galletas",
    slug: "galletas",
    description: "Galletas horneadas el mismo día.",
    products: [
      {
        name: "Galletas con chips de chocolate",
        slug: "galletas-chips-de-chocolate",
        description: "Crujientes por fuera, suaves por dentro.",
        isFeatured: true,
        variants: [
          { name: "Caja x6", sku: "GAL-CHIP-6", price: 18000 },
          { name: "Caja x12", sku: "GAL-CHIP-12", price: 33000 },
        ],
      },
      {
        name: "Galletas de avena y arequipe",
        slug: "galletas-avena-arequipe",
        description: "Avena, mantequilla y un centro de arequipe.",
        variants: [
          { name: "Caja x6", sku: "GAL-AVE-6", price: 16000 },
          { name: "Caja x12", sku: "GAL-AVE-12", price: 30000 },
        ],
      },
    ],
  },
  {
    name: "Postres",
    slug: "postres",
    description: "Postres individuales y para compartir.",
    products: [
      {
        name: "Tres leches",
        slug: "tres-leches",
        description: "Bizcocho bañado en tres leches con merengue.",
        variants: [
          { name: "Individual", sku: "POS-3L-1", price: 9000 },
          { name: "Familiar (8 porciones)", sku: "POS-3L-8", price: 55000 },
        ],
      },
      {
        name: "Brownie",
        slug: "brownie",
        description: "Brownie de chocolate con nueces.",
        variants: [
          { name: "Unidad", sku: "POS-BRW-1", price: 6500 },
          { name: "Caja x6", sku: "POS-BRW-6", price: 36000 },
        ],
      },
    ],
  },
];

async function main() {
  for (const [categoryIndex, category] of catalog.entries()) {
    const { products, ...categoryData } = category;
    const savedCategory = await db.category.upsert({
      where: { slug: category.slug },
      update: { ...categoryData, sortOrder: categoryIndex },
      create: { ...categoryData, sortOrder: categoryIndex },
    });

    for (const product of products) {
      const { variants, ...productData } = product;
      const savedProduct = await db.product.upsert({
        where: { slug: product.slug },
        update: { ...productData, categoryId: savedCategory.id },
        create: { ...productData, categoryId: savedCategory.id },
      });

      for (const [variantIndex, variant] of variants.entries()) {
        await db.productVariant.upsert({
          where: { sku: variant.sku },
          update: { ...variant, sortOrder: variantIndex, productId: savedProduct.id },
          create: { ...variant, sortOrder: variantIndex, productId: savedProduct.id },
        });
      }
    }
  }

  const [categories, products, variants] = await Promise.all([
    db.category.count(),
    db.product.count(),
    db.productVariant.count(),
  ]);
  console.log(
    `✅ Seed listo: ${categories} categorías, ${products} productos, ${variants} variantes.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
