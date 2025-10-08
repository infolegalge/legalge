import { PrismaClient } from '@prisma/client';
import { OFFICIAL_PHONE } from '@/config/contact';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding specialists and companies...');

  // Create sample companies
  const company1 = await prisma.company.upsert({
    where: { slug: 'legal-sandbox-georgia' },
    update: {},
    create: {
      slug: 'legal-sandbox-georgia',
      name: 'Legal Sandbox Georgia',
      description: 'A leading legal firm specializing in corporate law, international business, and regulatory compliance in Georgia.',
      shortDesc: 'Innovating legal services in Georgia with expert guidance and cutting-edge solutions.',
      longDesc: `
        <p>Legal Sandbox Georgia is a premier legal firm at the forefront of legal innovation in Georgia. We combine traditional legal expertise with modern technology and forward-thinking approaches to deliver exceptional results for our clients.</p>
        
        <p>Our team of experienced legal professionals specializes in a wide range of practice areas, from corporate law and international business transactions to regulatory compliance and dispute resolution. We pride ourselves on our deep understanding of both local Georgian law and international legal frameworks.</p>
        
        <p>Founded with a vision to modernize legal services in Georgia, we have built a reputation for excellence, integrity, and innovation. Our clients range from startups and small businesses to large corporations and international organizations seeking expert legal guidance in the Georgian market.</p>
        
        <h3>Our Approach</h3>
        <p>We believe in providing personalized, strategic legal solutions that align with our clients' business objectives. Our collaborative approach ensures that every client receives the attention and expertise they deserve.</p>
        
        <h3>Why Choose Us</h3>
        <ul>
          <li>Deep expertise in Georgian and international law</li>
          <li>Innovative approach to legal problem-solving</li>
          <li>Multilingual team fluent in Georgian, English, and Russian</li>
          <li>Proven track record of successful outcomes</li>
          <li>Commitment to client satisfaction and transparency</li>
        </ul>
      `,
      logoUrl: '/logo-light.png',
      website: 'https://legal.ge',
      phone: OFFICIAL_PHONE,
      email: 'contact@legal.ge',
      address: 'Georgia, Tbilisi, Agmashnebeli alley N240, 0159',
      mapLink: 'https://www.google.com/maps/dir/?api=1&destination=41.80594854658469,44.767832572133464',
    },
  });

  const company2 = await prisma.company.upsert({
    where: { slug: 'tbilisi-legal-partners' },
    update: {},
    create: {
      slug: 'tbilisi-legal-partners',
      name: 'Tbilisi Legal Partners',
      description: 'Boutique law firm focusing on commercial litigation and dispute resolution.',
      shortDesc: 'Boutique law firm specializing in commercial litigation and complex dispute resolution.',
      longDesc: `
        <p>Tbilisi Legal Partners is a boutique law firm that has built its reputation on excellence in commercial litigation and dispute resolution. Our focused approach allows us to provide specialized, high-quality legal services to clients facing complex legal challenges.</p>
        
        <p>With a team of experienced litigators and dispute resolution specialists, we have successfully represented clients in high-stakes commercial disputes, arbitration proceedings, and complex negotiations. Our expertise spans various industries and legal domains.</p>
      `,
      website: 'https://tbilisilegal.ge',
      phone: '+995 598 295 431',
      email: 'info@tbilisilegal.ge',
      address: 'Tbilisi, Georgia',
    },
  });

  console.log('✅ Companies created:', company1.name, company2.name);

  // Create sample specialists
  const specialist1 = await prisma.specialistProfile.upsert({
    where: { slug: 'nino-khvedelidze' },
    update: {},
    create: {
      slug: 'nino-khvedelidze',
      name: 'Nino Khvedelidze',
      role: 'Senior Corporate Lawyer',
      bio: 'Nino specializes in corporate law, mergers & acquisitions, and international business transactions. With over 10 years of experience, she has successfully guided numerous companies through complex legal processes.',
      avatarUrl: '/specialists/nino-khvedelidze.jpg',
      languages: JSON.stringify(['Georgian', 'English', 'Russian']),
      specializations: JSON.stringify(['Corporate Law', 'M&A', 'International Business', 'Contract Law']),
      contactEmail: 'nino@legal.ge',
      contactPhone: OFFICIAL_PHONE,
      companyId: company1.id,
    },
  });

  const specialist2 = await prisma.specialistProfile.upsert({
    where: { slug: 'giorgi-meladze' },
    update: {},
    create: {
      slug: 'giorgi-meladze',
      name: 'Giorgi Meladze',
      role: 'Litigation Specialist',
      bio: 'Giorgi is an experienced litigation attorney with expertise in commercial disputes, employment law, and regulatory compliance. He has represented clients in both Georgian and international courts.',
      avatarUrl: '/specialists/giorgi-meladze.jpg',
      languages: JSON.stringify(['Georgian', 'English']),
      specializations: JSON.stringify(['Litigation', 'Commercial Disputes', 'Employment Law', 'Regulatory Compliance']),
      contactEmail: 'giorgi@legal.ge',
      contactPhone: '+995 598 295 430',
      companyId: company1.id,
    },
  });

  const specialist3 = await prisma.specialistProfile.upsert({
    where: { slug: 'ana-beridze' },
    update: {},
    create: {
      slug: 'ana-beridze',
      name: 'Ana Beridze',
      role: 'Partner',
      bio: 'Ana is a founding partner of Tbilisi Legal Partners, specializing in commercial litigation and dispute resolution. She has over 15 years of experience in complex commercial matters.',
      avatarUrl: '/specialists/ana-beridze.jpg',
      languages: JSON.stringify(['Georgian', 'English', 'French']),
      specializations: JSON.stringify(['Commercial Litigation', 'Dispute Resolution', 'Contract Law', 'Business Law']),
      contactEmail: 'ana@tbilisilegal.ge',
      contactPhone: '+995 598 295 431',
      companyId: company2.id,
    },
  });

  const specialist4 = await prisma.specialistProfile.upsert({
    where: { slug: 'davit-gogoladze' },
    update: {},
    create: {
      slug: 'davit-gogoladze',
      name: 'Davit Gogoladze',
      role: 'Solo Practitioner',
      bio: 'Davit is an independent legal consultant specializing in intellectual property law, technology law, and startup legal services. He works with innovative companies and entrepreneurs.',
      avatarUrl: '/specialists/davit-gogoladze.jpg',
      languages: JSON.stringify(['Georgian', 'English', 'German']),
      specializations: JSON.stringify(['Intellectual Property', 'Technology Law', 'Startup Legal Services', 'Data Protection']),
      contactEmail: 'davit@ip-law.ge',
      contactPhone: '+995 598 295 432',
      // No companyId - solo practitioner
    },
  });

  console.log('✅ Specialists created:', specialist1.name, specialist2.name, specialist3.name, specialist4.name);

  // Get some services to link to specialists
  const services = await prisma.service.findMany({ take: 4 });
  
  if (services.length > 0) {
    // Link specialists to services
    await prisma.specialistProfile.update({
      where: { id: specialist1.id },
      data: {
        services: {
          connect: services.slice(0, 2).map(s => ({ id: s.id })),
        },
      },
    });

    await prisma.specialistProfile.update({
      where: { id: specialist2.id },
      data: {
        services: {
          connect: services.slice(1, 3).map(s => ({ id: s.id })),
        },
      },
    });

    await prisma.specialistProfile.update({
      where: { id: specialist3.id },
      data: {
        services: {
          connect: services.slice(2, 4).map(s => ({ id: s.id })),
        },
      },
    });

    await prisma.specialistProfile.update({
      where: { id: specialist4.id },
      data: {
        services: {
          connect: services.slice(0, 1).map(s => ({ id: s.id })),
        },
      },
    });

    console.log('✅ Linked specialists to services');
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
