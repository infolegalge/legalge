import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '@/lib/auth-utils';

const prisma = new PrismaClient();

async function testSignIn() {
  console.log('🧪 Testing Sign-in Process...');
  
  const testEmail = 'test@example.com';
  const testPassword = 'testpassword123';
  
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (!user) {
      console.log('❌ User not found:', testEmail);
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('📧 Email verified:', user.emailVerified ? 'Yes' : 'No');
    console.log('👑 Role:', user.role);
    console.log('🔐 Has password:', user.password ? 'Yes' : 'No');

    if (!user.password) {
      console.log('❌ User has no password');
      return;
    }

    // Test password verification
    const isPasswordValid = await verifyPassword(testPassword, user.password);
    console.log('🔑 Password valid:', isPasswordValid);

    if (isPasswordValid) {
      console.log('✅ Sign-in should work!');
      console.log('📊 User data for NextAuth:');
      console.log({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      console.log('❌ Password verification failed');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSignIn();

