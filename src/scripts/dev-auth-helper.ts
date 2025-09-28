import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupDevAuth() {
  try {
    console.log("🔧 Setting up development authentication...\n");

    // Check if admin user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@legalsandbox.ge" },
    });

    if (existingUser) {
      console.log("✅ Admin user already exists:");
      console.log(`   📧 Email: ${existingUser.email}`);
      console.log(`   🔑 Role: ${existingUser.role}`);
      console.log(`   🆔 ID: ${existingUser.id}`);
    } else {
      console.log("❌ Admin user not found. Creating one...");
      
      const adminUser = await prisma.user.create({
        data: {
          email: "admin@legalsandbox.ge",
          name: "Admin User",
          role: "SUPER_ADMIN",
          emailVerified: new Date(),
        },
      });

      console.log("✅ Admin user created:");
      console.log(`   📧 Email: ${adminUser.email}`);
      console.log(`   🔑 Role: ${adminUser.role}`);
      console.log(`   🆔 ID: ${adminUser.id}`);
    }

    console.log("\n🎯 How to access the CMS:");
    console.log("1. 🌐 Go to: http://localhost:3002/ka");
    console.log("2. 🔐 Click 'Sign In' button in the header");
    console.log("3. 🔑 Sign in with Google using: admin@legalsandbox.ge");
    console.log("4. ✨ The 'CMS' link will appear in the header");
    console.log("5. 🎛️  Click 'CMS' to access the admin panel");

    console.log("\n⚠️  Important Notes:");
    console.log("• You must use the exact email: admin@legalsandbox.ge");
    console.log("• The Google OAuth must be configured with this email");
    console.log("• If you don't have access to this email, contact the developer");

    console.log("\n🔧 Alternative: Direct Admin Access");
    console.log("If you can't access the Google account, you can:");
    console.log("1. Update SUPER_ADMIN_EMAIL in .env.local to your email");
    console.log("2. Run this script again to update the admin user");
    console.log("3. Sign in with your Google account");

  } catch (error) {
    console.error("❌ Error setting up development auth:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDevAuth();
