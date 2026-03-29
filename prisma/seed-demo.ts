import "dotenv/config";
import { seedDemoOrganization } from "../src/lib/demo-seed";
import prisma from "../src/lib/prisma";

async function main() {
  await seedDemoOrganization();
  console.log("Demo seed complete: 4 tenants — acme-demo, beta-demo, gamma-demo, delta-demo.");
  console.log("Passwords: employees demo123 · org admins admin123");
  console.log(
    "Examples: demo@acme.com · demo@beta-demo.com · demo@gamma-demo.com · demo@delta-demo.com (same pattern for admin@…)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
