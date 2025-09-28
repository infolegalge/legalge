import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateAdminEmail() {
  try {
    console.log("🔄 Updating admin email to infolegalge@gmail.com...\n");

    // Update existing admin user or create new one
    const adminUser = await prisma.user.upsert({
      where: { email: "infolegalge@gmail.com" },
      update: { role: "SUPER_ADMIN" },
      create: {
        email: "infolegalge@gmail.com",
        name: "Legal Ge Admin",
        role: "SUPER_ADMIN",
        emailVerified: new Date(),
      },
    });

    console.log("✅ Admin user updated:");
    console.log(`   📧 Email: ${adminUser.email}`);
    console.log(`   🔑 Role: ${adminUser.role}`);
    console.log(`   🆔 ID: ${adminUser.id}`);

    // Remove old admin user if it exists
    try {
      const oldAdmin = await prisma.user.findUnique({
        where: { email: "admin@legalsandbox.ge" },
      });
      
      if (oldAdmin) {
        await prisma.user.delete({
          where: { email: "admin@legalsandbox.ge" },
        });
        console.log("🗑️  Removed old admin user: admin@legalsandbox.ge");
      }
    } catch (error) {
      console.log("ℹ️  No old admin user to remove");
    }

    console.log("\n🎯 Updated CMS Access:");
    console.log("1. 🌐 Go to: http://localhost:3002/ka");
    console.log("2. 🔐 Click 'Sign In' button in the header");
    console.log("3. 🔑 Sign in with Google using: infolegalge@gmail.com");
    console.log("4. ✨ The 'CMS' link will appear in the header");
    console.log("5. 🎛️  Click 'CMS' to access the admin panel");

  } catch (error) {
    console.error("❌ Error updating admin email:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminEmail();
