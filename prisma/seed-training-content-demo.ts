import "dotenv/config";
import prisma from "../src/lib/prisma";
import { seedGlobalDemoTrainingContentTemplates } from "../src/lib/demo-seed";

/**
 * Inserts the published global "Demo: Excel Skills (sample)" template only.
 * Safe to run multiple times. Does not wipe users/orgs.
 */
async function main() {
  await seedGlobalDemoTrainingContentTemplates();
  console.log('Done. Look for template "Demo: Excel Skills (sample)" when creating a training program.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
