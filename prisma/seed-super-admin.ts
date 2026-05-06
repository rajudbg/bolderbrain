/**
 * Creates a Platform Super Admin user.
 * Run: npx tsx prisma/seed-super-admin.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";

const SUPER_ADMIN_EMAIL = "superadmin@bolderbrain.com";
const SUPER_ADMIN_PASSWORD = "superadmin123";

async function main() {
  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    create: {
      email: SUPER_ADMIN_EMAIL,
      name: "Platform Super Admin",
      passwordHash,
      isPlatformSuperAdmin: true,
      isActive: true,
    },
    update: {
      name: "Platform Super Admin",
      passwordHash,
      isPlatformSuperAdmin: true,
      isActive: true,
    },
  });

  console.log(`✅ Super Admin created/updated:`);
  console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log(`   isPlatformSuperAdmin: ${user.isPlatformSuperAdmin}`);
  console.log(`\n🚀 Login at: http://localhost:3000/login?portal=super`);
}

main()
  .catch((e) => {
    console.error("❌ Failed to create Super Admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
