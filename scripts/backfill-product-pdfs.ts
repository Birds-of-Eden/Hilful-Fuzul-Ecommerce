import { PrismaClient } from "@prisma/client";
import { products } from "../public/BookData";

const prisma = new PrismaClient();

async function main() {
  const candidates = products.filter(
    (product) => product.id <= 38 && Boolean(product.pdf),
  );

  let updated = 0;
  let preserved = 0;
  let missing = 0;

  for (const product of candidates) {
    const existing = await prisma.product.findUnique({
      where: { id: product.id },
      select: { pdf: true },
    });

    if (!existing) {
      missing += 1;
      continue;
    }

    if (existing.pdf) {
      preserved += 1;
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { pdf: product.pdf },
    });
    updated += 1;
  }

  console.log(
    `PDF backfill complete: ${updated} updated, ${preserved} preserved, ${missing} missing.`,
  );
}

main()
  .catch((error) => {
    console.error("PDF backfill failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
