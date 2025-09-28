import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.post.deleteMany();
  await prisma.specialistProfile.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      id: 'admin-user-id',
      email: 'admin@legal.ge',
      name: 'Admin User',
      role: 'SUPER_ADMIN',
    },
  });

  // Create companies
  console.log('🏢 Creating companies...');
  const companies = [
    {
      slug: 'legal-georgia',
      name: 'Legal Georgia',
      description: 'Leading legal services provider in Georgia',
      shortDesc: 'Your trusted legal partner',
      longDesc: 'Legal Georgia is a premier law firm providing comprehensive legal services across various practice areas including corporate law, immigration, and litigation.',
      logoUrl: '/logos/01black.webp',
      website: 'https://legal.ge',
      phone: '+995 32 123 4567',
      email: 'info@legal.ge',
      address: 'Tbilisi, Georgia',
      city: 'Tbilisi',
    },
    {
      slug: 'tbilisi-law-group',
      name: 'Tbilisi Law Group',
      description: 'Specialized legal services in Tbilisi',
      shortDesc: 'Expert legal advice in the capital',
      longDesc: 'Tbilisi Law Group offers tailored legal solutions for individuals and businesses, focusing on civil law, real estate, and dispute resolution.',
      logoUrl: '/logos/02black.webp',
      website: 'https://tbilisilaw.ge',
      phone: '+995 32 765 4321',
      email: 'contact@tbilisilaw.ge',
      address: 'Rustaveli Ave, Tbilisi',
      city: 'Tbilisi',
    },
    {
      slug: 'batumi-legal-services',
      name: 'Batumi Legal Services',
      description: 'Coastal legal expertise in Batumi',
      shortDesc: 'Legal services by the Black Sea',
      longDesc: 'Batumi Legal Services specializes in maritime law, tourism industry legal matters, and international business transactions in the coastal region.',
      logoUrl: '/logos/01gray.webp',
      website: 'https://batumilegal.ge',
      phone: '+995 422 123 456',
      email: 'info@batumilegal.ge',
      address: 'Batumi, Georgia',
      city: 'Batumi',
    },
    {
      slug: 'kutaisi-law-firm',
      name: 'Kutaisi Law Firm',
      description: 'Traditional legal practice in Kutaisi',
      shortDesc: 'Heritage of legal excellence',
      longDesc: 'Kutaisi Law Firm has been serving the community for over 30 years, specializing in family law, property disputes, and local business matters.',
      logoUrl: '/logos/02gray.webp',
      website: 'https://kutaisilaw.ge',
      phone: '+995 431 987 654',
      email: 'office@kutaisilaw.ge',
      address: 'Kutaisi, Georgia',
      city: 'Kutaisi',
    },
  ];

  const createdCompanies = [];
  for (const company of companies) {
    const created = await prisma.company.create({ data: company });
    createdCompanies.push(created);
    console.log(`   - Created company: ${created.name}`);
  }

  // Create company users
  console.log('👥 Creating company users...');
  const companyUsers = [];
  for (let i = 0; i < createdCompanies.length; i++) {
    const company = createdCompanies[i];
    const user = await prisma.user.create({
      data: {
        email: `company${i + 1}@${company.slug}.ge`,
        name: `${company.name} Admin`,
        role: 'COMPANY',
        companySlug: company.slug,
      },
    });
    companyUsers.push(user);
    console.log(`   - Created user for ${company.name}`);
  }

  // Create specialists
  console.log('👨‍💼 Creating specialists...');
  const specialists = [
    {
      slug: 'giorgi-khvedelidze',
      name: 'Giorgi Khvedelidze',
      role: 'Senior Partner',
      bio: 'Experienced corporate lawyer with 15+ years in international business law.',
      avatarUrl: '/uploads/specialists/giorgi-khvedelidze.webp',
      languages: JSON.stringify(['Georgian', 'English', 'Russian']),
      specializations: JSON.stringify(['Corporate Law', 'International Business', 'M&A']),
      contactEmail: 'giorgi@legal.ge',
      contactPhone: '+995 32 123 4567',
      city: 'Tbilisi',
      companyId: createdCompanies[0].id,
      philosophy: 'Every client deserves personalized attention and strategic legal solutions.',
      focusAreas: 'Corporate governance, cross-border transactions, and regulatory compliance.',
      representativeMatters: 'Led major M&A transactions worth over $100M in the Georgian market.',
      teachingWriting: 'Regular speaker at international legal conferences and author of several articles on corporate law.',
      credentials: 'LLM from Harvard Law School, admitted to the Georgian Bar Association.',
      values: 'Integrity, excellence, and client-focused approach to legal practice.',
    },
    {
      slug: 'nino-beridze',
      name: 'Nino Beridze',
      role: 'Immigration Specialist',
      bio: 'Dedicated immigration lawyer helping individuals and families navigate complex visa processes.',
      avatarUrl: '/uploads/specialists/nino-beridze.webp',
      languages: JSON.stringify(['Georgian', 'English', 'Turkish']),
      specializations: JSON.stringify(['Immigration Law', 'Visa Applications', 'Citizenship']),
      contactEmail: 'nino@legal.ge',
      contactPhone: '+995 32 123 4568',
      city: 'Tbilisi',
      companyId: createdCompanies[0].id,
      philosophy: 'Immigration law is about helping people build better futures.',
      focusAreas: 'Work visas, family reunification, and citizenship applications.',
      representativeMatters: 'Successfully processed over 500 visa applications with 95% approval rate.',
      teachingWriting: 'Contributor to immigration law publications and frequent speaker at community events.',
      credentials: 'JD from Tbilisi State University, certified immigration specialist.',
      values: 'Compassion, thoroughness, and cultural sensitivity in all client interactions.',
    },
    {
      slug: 'davit-gogoladze',
      name: 'Davit Gogoladze',
      role: 'Real Estate Attorney',
      bio: 'Expert in real estate transactions and property law with extensive local market knowledge.',
      avatarUrl: '/uploads/specialists/davit-gogoladze.webp',
      languages: JSON.stringify(['Georgian', 'English']),
      specializations: JSON.stringify(['Real Estate Law', 'Property Transactions', 'Land Disputes']),
      contactEmail: 'davit@tbilisilaw.ge',
      contactPhone: '+995 32 765 4322',
      city: 'Tbilisi',
      companyId: createdCompanies[1].id,
      philosophy: 'Real estate law should protect both buyers and sellers equally.',
      focusAreas: 'Commercial real estate, residential transactions, and property development.',
      representativeMatters: 'Handled major commercial property acquisitions in Tbilisi business district.',
      teachingWriting: 'Author of "Real Estate Law in Georgia" and regular contributor to property law journals.',
      credentials: 'LLB from Tbilisi State University, member of Georgian Real Estate Lawyers Association.',
      values: 'Transparency, fairness, and protecting client interests in all property matters.',
    },
    {
      slug: 'tamuna-kiknadze',
      name: 'Tamuna Kiknadze',
      role: 'Maritime Law Specialist',
      bio: 'Specialized in maritime law and international shipping regulations in the Black Sea region.',
      avatarUrl: '/uploads/specialists/tamuna-kiknadze.webp',
      languages: JSON.stringify(['Georgian', 'English', 'Russian', 'Turkish']),
      specializations: JSON.stringify(['Maritime Law', 'Shipping Regulations', 'Port Operations']),
      contactEmail: 'tamuna@batumilegal.ge',
      contactPhone: '+995 422 123 457',
      city: 'Batumi',
      companyId: createdCompanies[2].id,
      philosophy: 'Maritime law connects nations and facilitates global trade.',
      focusAreas: 'Port operations, shipping contracts, and maritime insurance.',
      representativeMatters: 'Represented major shipping companies in international maritime disputes.',
      teachingWriting: 'International speaker on maritime law and contributor to shipping industry publications.',
      credentials: 'LLM in Maritime Law from University of Southampton, certified maritime law specialist.',
      values: 'International cooperation, maritime safety, and sustainable shipping practices.',
    },
    {
      slug: 'levan-meladze',
      name: 'Levan Meladze',
      role: 'Family Law Attorney',
      bio: 'Compassionate family lawyer with deep understanding of local customs and traditions.',
      avatarUrl: '/uploads/specialists/levan-meladze.webp',
      languages: JSON.stringify(['Georgian', 'Russian']),
      specializations: JSON.stringify(['Family Law', 'Divorce', 'Child Custody', 'Inheritance']),
      contactEmail: 'levan@kutaisilaw.ge',
      contactPhone: '+995 431 987 655',
      city: 'Kutaisi',
      companyId: createdCompanies[3].id,
      philosophy: 'Family law should prioritize the best interests of children and families.',
      focusAreas: 'Divorce proceedings, child custody arrangements, and inheritance disputes.',
      representativeMatters: 'Successfully mediated over 200 family disputes with amicable resolutions.',
      teachingWriting: 'Community educator on family rights and contributor to family law resources.',
      credentials: 'JD from Kutaisi University, certified family mediator.',
      values: 'Empathy, confidentiality, and finding solutions that work for the whole family.',
    },
  ];

  const createdSpecialists = [];
  for (const specialist of specialists) {
    const created = await prisma.specialistProfile.create({ data: specialist });
    createdSpecialists.push(created);
    console.log(`   - Created specialist: ${created.name}`);
  }

  // Create news posts
  console.log('📰 Creating news posts...');
  const newsPosts = [
    {
      slug: 'new-immigration-laws-2024',
      title: 'New Immigration Laws Take Effect in Georgia',
      excerpt: 'Recent changes to immigration regulations will affect visa applications and residency requirements.',
      content: `
        <h2>Overview of Changes</h2>
        <p>The Georgian government has implemented new immigration laws that will significantly impact how foreign nationals apply for visas and residency permits. These changes aim to streamline the application process while maintaining security standards.</p>
        
        <h3>Key Changes Include:</h3>
        <ul>
          <li>Extended processing times for work visas</li>
          <li>New requirements for family reunification applications</li>
          <li>Updated documentation requirements for all visa types</li>
          <li>Enhanced background check procedures</li>
        </ul>
        
        <h3>Impact on Current Applications</h3>
        <p>Applications submitted before the new laws took effect will be processed under the previous regulations. However, any new applications must comply with the updated requirements.</p>
        
        <h3>What This Means for You</h3>
        <p>If you're planning to apply for a visa or residency permit, it's crucial to understand these new requirements. Our immigration specialists are ready to help you navigate these changes and ensure your application meets all current standards.</p>
      `,
      coverImageUrl: '/uploads/posts/immigration-laws-2024.webp',
      date: new Date('2024-01-15'),
      status: 'PUBLISHED',
      authorId: adminUser.id,
      companyId: createdCompanies[0].id,
    },
    {
      slug: 'corporate-law-updates-q1-2024',
      title: 'Corporate Law Updates: Q1 2024 Review',
      excerpt: 'A comprehensive review of corporate law changes and their implications for businesses in Georgia.',
      content: `
        <h2>Quarterly Corporate Law Review</h2>
        <p>The first quarter of 2024 brought several important changes to corporate law in Georgia. These updates affect everything from company formation to shareholder rights and corporate governance.</p>
        
        <h3>New Company Formation Requirements</h3>
        <p>Starting March 1st, 2024, all new company registrations must include additional documentation and meet enhanced compliance standards. This includes:</p>
        <ul>
          <li>Enhanced beneficial ownership disclosure requirements</li>
          <li>Updated articles of incorporation templates</li>
          <li>New requirements for foreign-owned companies</li>
        </ul>
        
        <h3>Shareholder Rights and Protections</h3>
        <p>The new legislation strengthens minority shareholder protections and introduces new mechanisms for dispute resolution. Companies should review their shareholder agreements to ensure compliance.</p>
        
        <h3>Corporate Governance Updates</h3>
        <p>Board composition requirements have been updated, with new diversity and independence standards for publicly traded companies.</p>
      `,
      coverImageUrl: '/uploads/posts/corporate-law-q1-2024.webp',
      date: new Date('2024-03-20'),
      status: 'PUBLISHED',
      authorId: companyUsers[0].id,
      companyId: createdCompanies[0].id,
    },
    {
      slug: 'real-estate-market-trends-2024',
      title: 'Real Estate Market Trends: What to Expect in 2024',
      excerpt: 'Analysis of current real estate market conditions and predictions for the coming year.',
      content: `
        <h2>Market Overview</h2>
        <p>The Georgian real estate market continues to show strong growth, with particular strength in commercial properties and luxury residential developments. Foreign investment remains a key driver of market activity.</p>
        
        <h3>Commercial Real Estate</h3>
        <p>Office space demand in Tbilisi's business districts continues to grow, driven by expanding international companies and local businesses. Rental rates have increased by 15% compared to last year.</p>
        
        <h3>Residential Market</h3>
        <p>New residential developments are focusing on sustainable building practices and modern amenities. The luxury segment shows particular strength, with several high-end projects breaking ground.</p>
        
        <h3>Investment Opportunities</h3>
        <p>Foreign investors continue to find attractive opportunities in Georgian real estate, particularly in tourism-related properties and commercial developments.</p>
        
        <h3>Legal Considerations</h3>
        <p>Recent changes to property law have streamlined the transaction process, but investors should be aware of new compliance requirements and tax implications.</p>
      `,
      coverImageUrl: '/uploads/posts/real-estate-trends-2024.webp',
      date: new Date('2024-02-10'),
      status: 'PUBLISHED',
      authorId: companyUsers[1].id,
      companyId: createdCompanies[1].id,
    },
    {
      slug: 'maritime-law-developments-batumi',
      title: 'Maritime Law Developments in Batumi Port',
      excerpt: 'Recent changes to port operations and maritime regulations affecting shipping in the Black Sea region.',
      content: `
        <h2>Port Operations Update</h2>
        <p>Batumi Port has implemented new operational procedures that affect all shipping companies using the facility. These changes aim to improve efficiency while maintaining international safety standards.</p>
        
        <h3>New Safety Regulations</h3>
        <p>Enhanced safety protocols now require additional documentation and compliance checks for all vessels entering the port. This includes:</p>
        <ul>
          <li>Updated environmental compliance certificates</li>
          <li>Enhanced crew documentation requirements</li>
          <li>New cargo inspection procedures</li>
        </ul>
        
        <h3>Customs and Clearance</h3>
        <p>Streamlined customs procedures have reduced average clearance times by 30%, but require updated documentation and electronic filing systems.</p>
        
        <h3>International Cooperation</h3>
        <p>New agreements with neighboring countries have simplified cross-border shipping procedures and reduced administrative burdens for international trade.</p>
      `,
      coverImageUrl: '/uploads/posts/maritime-law-batumi.webp',
      date: new Date('2024-01-25'),
      status: 'PUBLISHED',
      authorId: companyUsers[2].id,
      companyId: createdCompanies[2].id,
    },
    {
      slug: 'family-law-reforms-2024',
      title: 'Family Law Reforms: Protecting Children and Families',
      excerpt: 'New legislation strengthens protections for children and families in divorce and custody proceedings.',
      content: `
        <h2>Legislative Changes</h2>
        <p>The Georgian Parliament has passed comprehensive family law reforms that prioritize the best interests of children in all family court proceedings. These changes take effect immediately and affect all ongoing cases.</p>
        
        <h3>Child Custody Guidelines</h3>
        <p>New guidelines emphasize the importance of maintaining meaningful relationships with both parents when possible. The reforms include:</p>
        <ul>
          <li>Mandatory mediation for custody disputes</li>
          <li>Enhanced child welfare assessments</li>
          <li>New requirements for parenting plans</li>
          <li>Improved enforcement mechanisms</li>
        </ul>
        
        <h3>Divorce Proceedings</h3>
        <p>Streamlined divorce procedures reduce the time and cost of legal proceedings while ensuring fair distribution of assets and responsibilities.</p>
        
        <h3>Support for Families</h3>
        <p>New support services are available to help families navigate the legal process, including counseling and mediation services.</p>
      `,
      coverImageUrl: '/uploads/posts/family-law-reforms-2024.webp',
      date: new Date('2024-02-28'),
      status: 'PUBLISHED',
      authorId: companyUsers[3].id,
      companyId: createdCompanies[3].id,
    },
    {
      slug: 'international-business-opportunities',
      title: 'International Business Opportunities in Georgia',
      excerpt: 'Exploring the growing opportunities for international companies in the Georgian market.',
      content: `
        <h2>Market Growth</h2>
        <p>Georgia's strategic location and business-friendly environment continue to attract international companies looking to expand into the region. The government's commitment to economic reforms has created numerous opportunities for foreign investment.</p>
        
        <h3>Key Sectors</h3>
        <p>Several sectors show particular promise for international businesses:</p>
        <ul>
          <li>Technology and IT services</li>
          <li>Manufacturing and logistics</li>
          <li>Tourism and hospitality</li>
          <li>Financial services</li>
        </ul>
        
        <h3>Regulatory Environment</h3>
        <p>Recent regulatory changes have simplified business registration and operation procedures, making it easier for international companies to establish operations in Georgia.</p>
        
        <h3>Tax Incentives</h3>
        <p>Attractive tax incentives and free trade agreements provide additional benefits for international businesses considering Georgia as a base for regional operations.</p>
      `,
      coverImageUrl: '/uploads/posts/international-business-opportunities.webp',
      date: new Date('2024-03-15'),
      status: 'PUBLISHED',
      authorId: adminUser.id,
      companyId: createdCompanies[0].id,
    },
  ];

  const createdPosts = [];
  for (const post of newsPosts) {
    const created = await prisma.post.create({ data: post });
    createdPosts.push(created);
    console.log(`   - Created post: ${created.title}`);
  }

  // Final counts
  const userCount = await prisma.user.count();
  const companyCount = await prisma.company.count();
  const specialistCount = await prisma.specialistProfile.count();
  const postCount = await prisma.post.count();

  console.log('\n✅ Test data seeding completed!');
  console.log(`📊 Final counts:`);
  console.log(`   - ${userCount} users`);
  console.log(`   - ${companyCount} companies`);
  console.log(`   - ${specialistCount} specialists`);
  console.log(`   - ${postCount} posts`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
