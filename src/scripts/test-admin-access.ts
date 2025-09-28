import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const prisma = new PrismaClient();

async function testAdminAccess() {
  try {
    console.log("🧪 Testing admin access...\n");

    // Check admin user in database
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@legalsandbox.ge" },
    });

    if (!adminUser) {
      console.log("❌ No admin user found in database");
      return;
    }

    console.log("✅ Admin user found:");
    console.log(`   📧 Email: ${adminUser.email}`);
    console.log(`   🔑 Role: ${adminUser.role}`);
    console.log(`   🆔 ID: ${adminUser.id}`);

    // Test session retrieval
    console.log("\n🔍 Testing session retrieval...");
    
    // Check if we can get a session (this will be null in script context)
    const session = await getServerSession(authOptions);
    
    if (session) {
      console.log("✅ Session found:", session.user?.email);
    } else {
      console.log("ℹ️  No active session (expected in script context)");
    }

    // Test database connection
    console.log("\n🗄️  Testing database connection...");
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Total users: ${userCount}`);

    console.log("\n🎯 Next steps:");
    console.log("1. Open browser to: http://localhost:3002/ka");
    console.log("2. Look for 'Sign In' button in header");
    console.log("3. Click 'Sign In' to authenticate");
    console.log("4. After signing in, 'CMS' link should appear");
    console.log("5. Click 'CMS' to access admin panel");

    console.log("\n🔧 If CMS link doesn't appear:");
    console.log("• Check browser console for errors");
    console.log("• Verify Google OAuth is working");
    console.log("• Check if email matches admin@legalsandbox.ge");

  } catch (error) {
    console.error("❌ Error testing admin access:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminAccess();
