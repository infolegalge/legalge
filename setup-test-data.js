const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setupTestData() {
  console.log('Setting up test data...');

  try {
    // Find or create test company
    let company = await prisma.company.findUnique({
      where: { slug: 'legal-sandbox-georgia' },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Legal Sandbox Georgia',
          slug: 'legal-sandbox-georgia',
          description: 'Leading legal services company in Georgia',
          shortDesc: 'Innovating legal services in Georgia',
          longDesc: 'We provide comprehensive legal services to businesses and individuals across Georgia, specializing in corporate law, tax regulations, and business compliance.',
          logoUrl: '/logo-light.png',
          website: 'https://legalsandbox.ge',
          email: 'info@legalsandbox.ge',
          phone: '+995 32 123 4567',
          address: 'Tbilisi, Georgia',
          city: 'Tbilisi',
          mapLink: 'https://maps.google.com/tbilisi',
        },
      });
      console.log('✓ Created company:', company.name);
    } else {
      console.log('✓ Found existing company:', company.name);
    }

    // Find or create test users
    const hashedPassword = await bcrypt.hash('password123', 12);

    let companyUser = await prisma.user.findUnique({
      where: { email: 'company@legalsandbox.ge' },
    });

    if (!companyUser) {
      companyUser = await prisma.user.create({
        data: {
          name: 'Company Admin',
          email: 'company@legalsandbox.ge',
          password: hashedPassword,
          role: 'COMPANY',
          companyId: company.id,
          emailVerified: new Date(),
        },
      });
    }

    let specialistUser = await prisma.user.findUnique({
      where: { email: 'specialist@legalsandbox.ge' },
    });

    if (!specialistUser) {
      specialistUser = await prisma.user.create({
        data: {
          name: 'John Specialist',
          email: 'specialist@legalsandbox.ge',
          password: hashedPassword,
          role: 'SPECIALIST',
          companyId: company.id,
          emailVerified: new Date(),
        },
      });
    }

    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@legalsandbox.ge' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'admin@legalsandbox.ge',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          emailVerified: new Date(),
        },
      });
    }

    console.log('✓ Found/created users');

    // Find or create specialist profile
    let specialistProfile = await prisma.specialistProfile.findUnique({
      where: { slug: 'john-specialist' },
    });

    if (!specialistProfile) {
      specialistProfile = await prisma.specialistProfile.create({
        data: {
          slug: 'john-specialist',
          name: 'John Specialist',
          role: 'Senior Legal Advisor',
          bio: 'Experienced legal professional with expertise in corporate law and tax regulations.',
          contactEmail: 'specialist@legalsandbox.ge',
          contactPhone: '+995 32 123 4568',
          city: 'Tbilisi',
          companyId: company.id,
          status: 'ACTIVE',
          languages: JSON.stringify(['English', 'Georgian']),
          specializations: JSON.stringify(['Corporate Law', 'Tax Law', 'Business Compliance']),
        },
      });
      console.log('✓ Created specialist profile');
    } else {
      console.log('✓ Found existing specialist profile');
    }

    // Find or create global categories
    const categorySlugs = ['legal-news', 'legal-advice', 'legislation', 'case-studies'];
    const categoryNames = ['Legal News', 'Legal Advice', 'Legislation', 'Case Studies'];
    
    const categories = [];
    for (let i = 0; i < categorySlugs.length; i++) {
      let category = await prisma.category.findUnique({
        where: { slug: categorySlugs[i] },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            slug: categorySlugs[i],
            name: categoryNames[i],
            type: 'GLOBAL',
            isPublic: true,
          },
        });
      }
      categories.push(category);
    }

    console.log('✓ Found/created categories');

    console.log('\nTest data setup completed!');
    console.log('\nLogin credentials:');
    console.log('Company User: company@legalsandbox.ge / password123');
    console.log('Specialist User: specialist@legalsandbox.ge / password123');
    console.log('Admin User: admin@legalsandbox.ge / password123');

  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}

async function main() {
  try {
    await setupTestData();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
