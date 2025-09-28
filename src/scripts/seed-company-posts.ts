import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding company posts...');

  // Get the companies
  const legalSandbox = await prisma.company.findUnique({
    where: { slug: 'legal-sandbox-georgia' }
  });

  const tbilisiLegal = await prisma.company.findUnique({
    where: { slug: 'tbilisi-legal-partners' }
  });

  if (!legalSandbox || !tbilisiLegal) {
    console.error('❌ Companies not found. Please run seed-specialists.ts first.');
    return;
  }

  // Create sample posts for Legal Sandbox Georgia
  const post1 = await prisma.post.upsert({
    where: { slug: 'new-corporate-law-regulations-2024' },
    update: {},
    create: {
      slug: 'new-corporate-law-regulations-2024',
      title: 'New Corporate Law Regulations in Georgia: What You Need to Know',
      excerpt: 'Recent changes to Georgian corporate law will impact businesses operating in the country. Our legal experts break down the key changes and their implications.',
      content: `
        <p>The Georgian Parliament has recently passed significant amendments to the corporate law framework, introducing new regulations that will affect businesses across the country. As legal professionals at Legal Sandbox Georgia, we want to ensure our clients are well-informed about these changes.</p>
        
        <h2>Key Changes</h2>
        <ul>
          <li>Enhanced transparency requirements for corporate governance</li>
          <li>New reporting obligations for foreign-owned entities</li>
          <li>Updated compliance procedures for mergers and acquisitions</li>
          <li>Strengthened minority shareholder protections</li>
        </ul>
        
        <p>These changes represent a significant step forward in aligning Georgian corporate law with international best practices. Our team is ready to help you navigate these new requirements and ensure your business remains compliant.</p>
      `,
      coverImageUrl: '/posts/corporate-law-2024.jpg',
      date: new Date('2024-01-15'),
      companyId: legalSandbox.id,
    },
  });

  const post2 = await prisma.post.upsert({
    where: { slug: 'international-business-expansion-guide' },
    update: {},
    create: {
      slug: 'international-business-expansion-guide',
      title: 'Expanding Your Business to Georgia: A Legal Guide',
      excerpt: 'Thinking of expanding your business to Georgia? Our comprehensive guide covers the legal requirements, procedures, and best practices for international business expansion.',
      content: `
        <p>Georgia has become an increasingly attractive destination for international businesses looking to expand their operations. With its strategic location, business-friendly environment, and growing economy, the country offers numerous opportunities for foreign investors.</p>
        
        <h2>Legal Framework for Foreign Businesses</h2>
        <p>Foreign companies can establish their presence in Georgia through various legal structures, each with its own advantages and requirements. Understanding these options is crucial for making informed decisions about your expansion strategy.</p>
        
        <h3>Available Business Structures</h3>
        <ul>
          <li>Limited Liability Company (LLC)</li>
          <li>Joint Stock Company (JSC)</li>
          <li>Branch Office</li>
          <li>Representative Office</li>
        </ul>
        
        <p>Our experienced team can guide you through the entire process, from initial consultation to full establishment and ongoing compliance support.</p>
      `,
      coverImageUrl: '/posts/business-expansion.jpg',
      date: new Date('2024-01-10'),
      companyId: legalSandbox.id,
    },
  });

  // Create sample posts for Tbilisi Legal Partners
  const post3 = await prisma.post.upsert({
    where: { slug: 'commercial-litigation-trends-2024' },
    update: {},
    create: {
      slug: 'commercial-litigation-trends-2024',
      title: 'Commercial Litigation Trends in Georgia: 2024 Outlook',
      excerpt: 'Our litigation experts analyze the current trends in commercial disputes and what businesses can expect in the coming year.',
      content: `
        <p>As we move through 2024, several key trends are emerging in the commercial litigation landscape in Georgia. Understanding these trends can help businesses better prepare for potential disputes and develop effective risk management strategies.</p>
        
        <h2>Emerging Trends</h2>
        <ul>
          <li>Increased focus on alternative dispute resolution</li>
          <li>Growing complexity in cross-border commercial disputes</li>
          <li>Enhanced emphasis on digital evidence and cybersecurity</li>
          <li>Rising importance of regulatory compliance in litigation</li>
        </ul>
        
        <p>At Tbilisi Legal Partners, we stay at the forefront of these developments to provide our clients with the most effective representation and strategic advice.</p>
      `,
      coverImageUrl: '/posts/litigation-trends.jpg',
      date: new Date('2024-01-08'),
      companyId: tbilisiLegal.id,
    },
  });

  const post4 = await prisma.post.upsert({
    where: { slug: 'arbitration-vs-litigation-guide' },
    update: {},
    create: {
      slug: 'arbitration-vs-litigation-guide',
      title: 'Arbitration vs. Litigation: Choosing the Right Dispute Resolution Method',
      excerpt: 'When facing a commercial dispute, choosing between arbitration and litigation can significantly impact the outcome. Our experts explain the key differences and considerations.',
      content: `
        <p>One of the most important decisions in commercial dispute resolution is choosing between arbitration and traditional litigation. Each method has its own advantages and disadvantages, and the right choice depends on various factors specific to your situation.</p>
        
        <h2>Key Considerations</h2>
        <h3>Arbitration Advantages</h3>
        <ul>
          <li>Faster resolution process</li>
          <li>Confidentiality and privacy</li>
          <li>Expert arbitrators with industry knowledge</li>
          <li>Flexible procedures</li>
        </ul>
        
        <h3>Litigation Advantages</h3>
        <ul>
          <li>Public record and transparency</li>
          <li>Appeal rights</li>
          <li>Established legal precedents</li>
          <li>Comprehensive discovery process</li>
        </ul>
        
        <p>Our experienced dispute resolution team can help you evaluate your options and choose the most appropriate method for your specific case.</p>
      `,
      coverImageUrl: '/posts/arbitration-vs-litigation.jpg',
      date: new Date('2024-01-05'),
      companyId: tbilisiLegal.id,
    },
  });

  console.log('✅ Company posts created:', post1.title, post2.title, post3.title, post4.title);
  console.log('🎉 Company posts seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
