import prisma from '@/lib/prisma';

async function setupGoogleOAuth() {
  const adminEmail = 'infolegalge@gmail.com';
  
  try {
    console.log('🔍 Setting up Google OAuth for admin account...');
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      include: {
        accounts: true
      }
    });

    if (!existingUser) {
      console.log('❌ Admin user not found. Please run fix-admin-account.ts first.');
      return;
    }

    console.log('👤 Admin user found:');
    console.log('📧 Email:', existingUser.email);
    console.log('👑 Role:', existingUser.role);
    console.log('🔗 OAuth Accounts:', existingUser.accounts.length);

    // Check if Google OAuth is configured
    const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;

    console.log('\n🔧 Google OAuth Configuration:');
    console.log('🔑 GOOGLE_CLIENT_ID:', hasGoogleClientId ? '✅ Set' : '❌ Missing');
    console.log('🔐 GOOGLE_CLIENT_SECRET:', hasGoogleClientSecret ? '✅ Set' : '❌ Missing');

    if (!hasGoogleClientId || !hasGoogleClientSecret) {
      console.log('\n⚠️  Google OAuth is not configured!');
      console.log('📝 To enable Google login, you need to:');
      console.log('1. Go to https://console.developers.google.com/');
      console.log('2. Create a new project or select existing one');
      console.log('3. Enable Google+ API');
      console.log('4. Create OAuth 2.0 credentials');
      console.log('5. Add authorized redirect URI: http://localhost:3001/api/auth/callback/google');
      console.log('6. Set environment variables:');
      console.log('   GOOGLE_CLIENT_ID=your_client_id');
      console.log('   GOOGLE_CLIENT_SECRET=your_client_secret');
      console.log('\n💡 For now, you can use email/password login:');
      console.log('📧 Email: infolegalge@gmail.com');
      console.log('🔑 Password: admin123456');
      return;
    }

    console.log('\n✅ Google OAuth is configured!');
    console.log('🌐 You can now log in with:');
    console.log('1. Email/Password: infolegalge@gmail.com / admin123456');
    console.log('2. Google OAuth: Click "Continue with Google"');
    
    // Check if user has Google account linked
    const googleAccount = existingUser.accounts.find(acc => acc.provider === 'google');
    
    if (googleAccount) {
      console.log('✅ Google account is already linked!');
    } else {
      console.log('⚠️  Google account not linked yet.');
      console.log('💡 To link your Google account:');
      console.log('1. Go to http://localhost:3001/auth/signin');
      console.log('2. Click "Continue with Google"');
      console.log('3. Sign in with your Gmail account');
      console.log('4. The accounts will be automatically linked');
    }
    
  } catch (error) {
    console.error('❌ Error setting up Google OAuth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupGoogleOAuth();

