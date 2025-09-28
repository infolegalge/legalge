import { authOptions } from '@/auth';

async function checkGoogleOAuthConfig() {
  console.log('🔍 Checking Google OAuth Configuration...');
  
  // Check environment variables
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  
  console.log('\n📋 Environment Variables:');
  console.log('🔑 GOOGLE_CLIENT_ID:', googleClientId ? `✅ Set (${googleClientId.substring(0, 20)}...)` : '❌ Missing');
  console.log('🔐 GOOGLE_CLIENT_SECRET:', googleClientSecret ? `✅ Set (${googleClientSecret.substring(0, 10)}...)` : '❌ Missing');
  console.log('🌐 NEXTAUTH_URL:', nextAuthUrl || '❌ Missing');
  
  // Check auth options
  console.log('\n🔧 NextAuth Configuration:');
  console.log('📊 Total Providers:', authOptions.providers?.length || 0);
  
  const googleProvider = authOptions.providers?.find(p => (p as any).id === 'google');
  console.log('🔍 Google Provider:', googleProvider ? '✅ Found' : '❌ Not found');
  
  if (googleProvider) {
    console.log('\n✅ Google OAuth is configured in NextAuth!');
  } else {
    console.log('\n❌ Google OAuth is not configured in NextAuth');
    return;
  }
  
  // Check redirect URI
  const expectedRedirectUri = `${nextAuthUrl}/api/auth/callback/google`;
  console.log('\n🔗 Redirect URI Configuration:');
  console.log('📝 Expected Redirect URI:', expectedRedirectUri);
  console.log('⚠️  Make sure this EXACT URI is added to your Google Cloud Console!');
  
  // Common issues and solutions
  console.log('\n🚨 Common "Access Blocked" Issues:');
  console.log('1. ❌ Redirect URI mismatch');
  console.log('   Solution: Add this EXACT URI to Google Console:');
  console.log(`   ${expectedRedirectUri}`);
  console.log('');
  console.log('2. ❌ OAuth consent screen not configured');
  console.log('   Solution: Configure OAuth consent screen in Google Console');
  console.log('   - Go to APIs & Services > OAuth consent screen');
  console.log('   - Add your email as a test user');
  console.log('   - Set app status to "Testing" or "Production"');
  console.log('');
  console.log('3. ❌ Google+ API not enabled');
  console.log('   Solution: Enable Google+ API or Google Identity API');
  console.log('   - Go to APIs & Services > Library');
  console.log('   - Search for "Google+ API" or "Google Identity"');
  console.log('   - Click Enable');
  console.log('');
  console.log('4. ❌ App domain not verified');
  console.log('   Solution: For localhost, this should work automatically');
  console.log('   For production, verify your domain in Google Console');
  
  console.log('\n🔧 Quick Fix Steps:');
  console.log('1. Go to https://console.developers.google.com/');
  console.log('2. Select your project');
  console.log('3. Go to APIs & Services > Credentials');
  console.log('4. Click on your OAuth 2.0 Client ID');
  console.log('5. Add this URI to "Authorized redirect URIs":');
  console.log(`   ${expectedRedirectUri}`);
  console.log('6. Save the changes');
  console.log('7. Go to APIs & Services > OAuth consent screen');
  console.log('8. Add infolegalge@gmail.com as a test user');
  console.log('9. Try logging in again');
}

checkGoogleOAuthConfig();

