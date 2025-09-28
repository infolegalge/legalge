import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-utils';

async function fixAdminAccount() {
  const adminEmail = 'infolegalge@gmail.com';
  
  try {
    console.log('🔍 Checking admin account...');
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      include: {
        accounts: true
      }
    });

    if (!existingUser) {
      console.log('❌ Admin user not found. Creating new admin account...');
      
      // Create new admin user with password
      const hashedPassword = await hashPassword('admin123456'); // Default password
      
      const newUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Admin User',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          emailVerified: new Date(), // Mark as verified
        }
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', newUser.email);
      console.log('🔑 Password: admin123456');
      console.log('👑 Role:', newUser.role);
      
    } else {
      console.log('👤 Admin user found:');
      console.log('📧 Email:', existingUser.email);
      console.log('👑 Role:', existingUser.role);
      console.log('🔐 Has Password:', !!existingUser.password);
      console.log('✅ Email Verified:', !!existingUser.emailVerified);
      console.log('🔗 OAuth Accounts:', existingUser.accounts.length);
      
      // Check if user has password but not verified
      if (existingUser.password && !existingUser.emailVerified) {
        console.log('🔧 Fixing email verification...');
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { 
            emailVerified: new Date(),
            role: 'SUPER_ADMIN' // Ensure admin role
          }
        });
        
        console.log('✅ Email verification fixed!');
      }
      
      // If user doesn't have password, add one
      if (!existingUser.password) {
        console.log('🔧 Adding password to existing account...');
        
        const hashedPassword = await hashPassword('admin123456');
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { 
            password: hashedPassword,
            emailVerified: new Date(),
            role: 'SUPER_ADMIN'
          }
        });
        
        console.log('✅ Password added successfully!');
        console.log('🔑 Password: admin123456');
      }
      
      // Ensure admin role
      if (existingUser.role !== 'SUPER_ADMIN') {
        console.log('🔧 Upgrading to SUPER_ADMIN role...');
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'SUPER_ADMIN' }
        });
        
        console.log('✅ Role upgraded to SUPER_ADMIN!');
      }
    }
    
    console.log('\n🎉 Admin account is ready!');
    console.log('📧 Email: infolegalge@gmail.com');
    console.log('🔑 Password: admin123456');
    console.log('🌐 Login at: http://localhost:3001/auth/signin');
    console.log('🏠 Admin panel: http://localhost:3001/ka/admin');
    
  } catch (error) {
    console.error('❌ Error fixing admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminAccount();

