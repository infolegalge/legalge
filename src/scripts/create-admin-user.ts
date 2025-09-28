import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Create a test admin user
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@legalsandbox.ge" },
      update: { role: "SUPER_ADMIN" },
      create: {
        email: "admin@legalsandbox.ge",
        name: "Admin User",
        role: "SUPER_ADMIN",
        emailVerified: new Date(),
      },
    });

    console.log("✅ Admin user created/updated:", adminUser);
    console.log("📧 Email: admin@legalsandbox.ge");
    console.log("🔑 Role: SUPER_ADMIN");
    console.log("\n🎯 To access the admin panel:");
    console.log("1. Go to http://localhost:3002/ka");
    console.log("2. Click 'Sign In' in the header");
    console.log("3. Sign in with Google using admin@legalsandbox.ge");
    console.log("4. The CMS link will appear in the header");
    console.log("5. Click CMS to access the admin panel");

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
