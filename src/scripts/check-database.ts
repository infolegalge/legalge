import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking Database...');
  
  try {
    // Check all users
    const users = await prisma.user.findMany();
    console.log('📊 Total users in database:', users.length);
    
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Name: ${user.name}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`  - Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Check for test user specifically
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (testUser) {
      console.log('✅ Test user found:', testUser.email);
    } else {
      console.log('❌ Test user not found');
    }

    // Check for admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'infolegalge@gmail.com' }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.email);
    } else {
      console.log('❌ Admin user not found');
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

