import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const userEmail = 'infolegalge@gmail.com';
const defaultPassword = 'admin123456';

async function deleteAndRecreateUser() {
  console.log('🗑️  Deleting and recreating user:', userEmail);
  
  try {
    // Delete existing user and all related data
    console.log('1. Deleting existing user...');
    await prisma.account.deleteMany({
      where: { user: { email: userEmail } }
    });
    
    await prisma.session.deleteMany({
      where: { user: { email: userEmail } }
    });
    
    await prisma.user.deleteMany({
      where: { email: userEmail }
    });
    
    console.log('✅ User deleted successfully');

    // Create new user
    console.log('2. Creating new user...');
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    const newUser = await prisma.user.create({
      data: {
        email: userEmail,
        name: 'Admin User',
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'SUPER_ADMIN'
      }
    });

    console.log('✅ New user created:', newUser.email);
    console.log('🔑 Password:', defaultPassword);
    console.log('👤 Role:', newUser.role);
    console.log('✅ Email verified:', newUser.emailVerified ? 'Yes' : 'No');

    console.log('\n🎯 Now you can:');
    console.log('1. Sign in with email/password:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log('2. Or sign in with Google OAuth');
    console.log('3. Both methods will work for the same account');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAndRecreateUser();

