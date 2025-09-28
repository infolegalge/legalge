import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';

async function linkOAuthAccount() {
  const email = 'infolegalge@gmail.com';
  
  try {
    console.log('🔍 Checking for OAuth account linking issues...');
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:');
    console.log('📧 Email:', user.email);
    console.log('👑 Role:', user.role);
    console.log('🔐 Has Password:', !!user.password);
    console.log('✅ Email Verified:', !!user.emailVerified);
    console.log('🔗 OAuth Accounts:', user.accounts.length);

    // If user has OAuth accounts but no password, add password
    if (user.accounts.length > 0 && !user.password) {
      console.log('🔧 Adding password to OAuth account...');
      
      const hashedPassword = await hashPassword('admin123456');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          emailVerified: new Date()
        }
      });
      
      console.log('✅ Password added to OAuth account!');
      console.log('🔑 Password: admin123456');
    }

    // If user has password but no OAuth accounts, that's fine
    if (user.password && user.accounts.length === 0) {
      console.log('✅ User has password authentication only - this is fine');
    }

    // If user has both, that's perfect
    if (user.password && user.accounts.length > 0) {
      console.log('✅ User has both password and OAuth authentication - perfect!');
    }

    console.log('\n🎉 Account linking complete!');
    console.log('📧 Email:', email);
    console.log('🔑 Password: admin123456');
      console.log('🌐 Login at: http://localhost:3002/auth/signin');
    
  } catch (error) {
    console.error('❌ Error linking OAuth account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkOAuthAccount();

