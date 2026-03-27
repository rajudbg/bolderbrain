import "dotenv/config";
import { seedDemoOrganization } from "../src/lib/demo-seed";
import prisma from "../src/lib/prisma";

async function main() {
  await seedDemoOrganization();
  console.log("Demo seed complete: Acme Corp (slug acme-demo).");
  console.log("Log in: demo@acme.com / demo123 (employee) or admin@acme.com / admin123 (admin).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
