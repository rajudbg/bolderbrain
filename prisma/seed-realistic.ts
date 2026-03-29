import "dotenv/config";
import { seedRealisticWorkforceData } from "../src/lib/realistic-demo-seed";
import prisma from "../src/lib/prisma";

async function main() {
  const slug = process.env.REALISTIC_ORG_SLUG ?? "acme-demo";
  const r = await seedRealisticWorkforceData(slug);
  console.log(r.message);
  console.log("Password for new employee accounts: demo123 (same as other demo users).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
