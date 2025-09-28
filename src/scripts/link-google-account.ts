import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userEmail = 'infolegalge@gmail.com';

async function linkGoogleAccount() {
  console.log('🔗 Linking Google Account for:', userEmail);
  
  try {
    // Find the existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { accounts: true }
    });

    if (!existingUser) {
      console.log('❌ User not found:', userEmail);
      return;
    }

    console.log('✅ Found user:', existingUser.email);
    console.log('📊 Current accounts:', existingUser.accounts.length);
    
    // Check if Google account already exists
    const googleAccount = existingUser.accounts.find(account => account.provider === 'google');
    
    if (googleAccount) {
      console.log('✅ Google account already linked!');
      console.log('🔑 Google Account ID:', googleAccount.providerAccountId);
      return;
    }

    // Check if there are any existing accounts
    if (existingUser.accounts.length > 0) {
      console.log('📋 Existing accounts:');
      existingUser.accounts.forEach(account => {
        console.log(`  - ${account.provider}: ${account.providerAccountId}`);
      });
    }

    console.log('\n🔧 To link Google account:');
    console.log('1. Go to: http://localhost:3002/auth/signin');
    console.log('2. Click "Continue with Google"');
    console.log('3. Sign in with your Gmail account');
    console.log('4. The system will automatically link the accounts');
    
    console.log('\n💡 Alternative: Delete and recreate the user');
    console.log('Run: npx tsx src/scripts/delete-and-recreate-user.ts');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkGoogleAccount();

