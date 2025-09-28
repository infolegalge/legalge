import { PrismaClient } from '@prisma/client';
import { registerUser } from '@/lib/auth-utils';

const prisma = new PrismaClient();

async function testRegistration() {
  console.log('🧪 Testing Registration Process...');
  
  const testEmail = 'test@example.com';
  const testPassword = 'testpassword123';
  const testName = 'Test User';
  
  try {
    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: { email: testEmail }
    });
    
    await prisma.emailVerification.deleteMany({
      where: { email: testEmail }
    });
    
    console.log('✅ Cleaned up existing test data');
    
    // Test registration
    console.log('📝 Attempting registration...');
    const result = await registerUser({
      email: testEmail,
      password: testPassword,
      name: testName
    });
    
    console.log('📊 Registration Result:', result);
    
    if (result.success) {
      console.log('✅ Registration successful!');
      
      // Check if user was created
      const user = await prisma.user.findUnique({
        where: { email: testEmail }
      });
      
      console.log('👤 User created:', user ? 'Yes' : 'No');
      if (user) {
        console.log('📧 Email verified:', user.emailVerified ? 'Yes' : 'No');
        console.log('👑 Role:', user.role);
      }
      
      // Check if verification code was created
      const verification = await prisma.emailVerification.findUnique({
        where: { email: testEmail }
      });
      
      console.log('🔐 Verification code created:', verification ? 'Yes' : 'No');
      if (verification) {
        console.log('⏰ Expires at:', verification.expires);
        console.log('✅ Verified:', verification.verified);
      }
      
    } else {
      console.log('❌ Registration failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: testEmail }
    });
    
    await prisma.emailVerification.deleteMany({
      where: { email: testEmail }
    });
    
    await prisma.$disconnect();
  }
}

testRegistration();

