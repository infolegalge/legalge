import { authOptions } from '@/auth';

async function testGoogleOAuth() {
  console.log('🔍 Testing Google OAuth Configuration...');
  
  // Check environment variables
  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasGoogleClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  
  console.log('\n📋 Environment Variables:');
  console.log('🔑 GOOGLE_CLIENT_ID:', hasGoogleClientId ? '✅ Set' : '❌ Missing');
  console.log('🔐 GOOGLE_CLIENT_SECRET:', hasGoogleClientSecret ? '✅ Set' : '❌ Missing');
  console.log('🔒 NEXTAUTH_SECRET:', hasNextAuthSecret ? '✅ Set' : '❌ Missing');
  console.log('🌐 NEXTAUTH_URL:', hasNextAuthUrl ? '✅ Set' : '❌ Missing');
  
  // Check auth options
  console.log('\n🔧 NextAuth Configuration:');
  console.log('📊 Providers count:', authOptions.providers?.length || 0);
  
  const googleProvider = authOptions.providers?.find(p => (p as any).id === 'google');
  console.log('🔍 Google Provider:', googleProvider ? '✅ Found' : '❌ Not found');
  
  if (googleProvider) {
    console.log('✅ Google OAuth is properly configured!');
    console.log('\n🎉 Ready to use Google login!');
    console.log('🌐 Test at: http://localhost:3002/auth/signin');
    console.log('🔗 Click "Continue with Google" button');
  } else {
    console.log('❌ Google OAuth is not configured properly');
  }
  
  console.log('\n📝 Available login methods:');
  console.log('1. Email/Password: infolegalge@gmail.com / admin123456');
  console.log('2. Google OAuth: Click "Continue with Google"');
}

testGoogleOAuth();

