const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestPosts() {
  console.log('Creating comprehensive test posts...');

  // Get existing users and categories
  const [companyUser, specialistUser, adminUser, categories] = await Promise.all([
    prisma.user.findFirst({
      where: { role: 'COMPANY' },
      include: { company: true },
    }),
    prisma.user.findFirst({
      where: { role: 'SPECIALIST' },
    }),
    prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    }),
    prisma.category.findMany(),
  ]);

  // Get specialist profile separately
  const specialistProfile = specialistUser ? await prisma.specialistProfile.findFirst({
    where: { contactEmail: 'specialist@legalsandbox.ge' },
  }) : null;

  if (!companyUser || !companyUser.company) {
    console.error('No company user found');
    return;
  }

  if (!specialistUser || !specialistProfile) {
    console.error('No specialist user or profile found');
    return;
  }

  if (!adminUser) {
    console.error('No admin user found');
    return;
  }

  console.log(`Using company: ${companyUser.company.name}`);
  console.log(`Using specialist: ${specialistProfile.name}`);
  console.log(`Using admin: ${adminUser.email}`);

  // Test posts for different scenarios
  const testPosts = [
    // Company posts
    {
      title: 'Corporate Law Updates: New Regulations in Georgia',
      slug: 'corporate-law-updates-2025',
      excerpt: 'Recent changes in Georgian corporate law that affect businesses operating in the country.',
      body: `# Corporate Law Updates: New Regulations in Georgia

The Georgian government has introduced several important changes to corporate law that will affect businesses operating in the country.

## Key Changes

### 1. Enhanced Disclosure Requirements
Companies are now required to provide more detailed financial disclosures, including:
- Quarterly financial statements
- Environmental impact reports
- Corporate governance practices

### 2. Stricter Compliance Standards
New compliance requirements include:
- Mandatory internal audit procedures
- Enhanced anti-corruption measures
- Improved data protection protocols

## Impact on Businesses

These changes will require businesses to:
- Update their internal procedures
- Train staff on new requirements
- Implement new reporting systems

## Next Steps

Companies should consult with legal experts to ensure full compliance with the new regulations.`,
      authorType: 'COMPANY',
      authorId: companyUser.id,
      companyId: companyUser.company.id,
      locale: 'en',
      categories: ['legal-news', 'legislation'],
      tags: ['corporate law', 'compliance', 'georgia', 'regulations'],
    },
    {
      title: 'კორპორატიული მართვის საუკეთესო პრაქტიკები',
      slug: 'corporate-governance-best-practices',
      excerpt: 'კორპორატიული მართვის თანამედროვე მიდგომები და რეკომენდაციები.',
      body: `# კორპორატიული მართვის საუკეთესო პრაქტიკები

თანამედროვე ბიზნეს გარემოში კორპორატიული მართვა ძალიან მნიშვნელოვანია.

## ძირითადი პრინციპები

### 1. გამჭვირვალობა
- რეგულარული ანგარიშგება
- ღია კომუნიკაცია
- ეთიკური ქცევა

### 2. პასუხისმგებლობა
- მენეჯმენტის პასუხისმგებლობა
- აქციონერების უფლებების დაცვა
- სტეიკჰოლდერების ინტერესების გათვალისწინება

## რეკომენდაციები

კომპანიებმა უნდა:
- შეიმუშაონ მკაფიო მართვის სტრუქტურა
- ჩაატარონ რეგულარული აუდიტები
- უზრუნველყონ უსაფრთხოების სტანდარტები`,
      authorType: 'COMPANY',
      authorId: companyUser.id,
      companyId: companyUser.company.id,
      locale: 'ka',
      categories: ['legal-advice', 'case-studies'],
      tags: ['კორპორატიული მართვა', 'ბიზნეს', 'ეთიკა', 'პასუხისმგებლობა'],
    },
    // Specialist posts
    {
      title: 'Tax Law Changes: What You Need to Know',
      slug: 'tax-law-changes-2025',
      excerpt: 'A comprehensive overview of recent tax law changes and their implications for individuals and businesses.',
      body: `# Tax Law Changes: What You Need to Know

The Georgian tax system has undergone significant reforms that will impact both individuals and businesses.

## Individual Tax Changes

### Income Tax Adjustments
- New progressive tax brackets
- Increased standard deduction
- Enhanced child tax credits

### Property Tax Updates
- Revised property valuation methods
- New exemptions for primary residences
- Updated commercial property rates

## Business Tax Implications

### Corporate Tax Rate
- Maintained at 15% for most businesses
- Special rates for certain industries
- Enhanced deductions for R&D investments

### VAT Changes
- Updated VAT registration thresholds
- New reporting requirements
- Streamlined refund procedures

## Planning Considerations

Taxpayers should:
- Review their current tax strategies
- Update their record-keeping systems
- Consult with tax professionals

## Conclusion

These changes present both opportunities and challenges. Proper planning and professional guidance are essential for navigating the new tax landscape.`,
      authorType: 'SPECIALIST',
      authorId: specialistUser.id,
      companyId: specialistProfile.companyId,
      locale: 'en',
      categories: ['legislation', 'legal-advice'],
      tags: ['tax law', 'individual taxes', 'business taxes', 'planning'],
    },
    {
      title: 'საგადასახადო სისტემის რეფორმები',
      slug: 'tax-system-reforms-georgia',
      excerpt: 'საქართველოს საგადასახადო სისტემის უახლესი ცვლილებები და მათი გავლენა.',
      body: `# საგადასახადო სისტემის რეფორმები

საქართველოში საგადასახადო სისტემა მნიშვნელოვან ცვლილებებს განიცდის.

## ფიზიკური პირებისთვის

### საშემოსავლო გადასახადი
- ახალი პროგრესული განაკვეთები
- გაზრდილი სტანდარტული გამოქვითვა
- ბავშვებისთვის გაზრდილი ლიმიტები

### ქონების გადასახადი
- განახლებული შეფასების მეთოდები
- ახალი გამონაკლისები
- კომერციული ქონების ახალი განაკვეთები

## ბიზნესისთვის

### კორპორატიული გადასახადი
- 15% განაკვეთი შენარჩუნებულია
- სპეციალური განაკვეთები ზოგიერთი სფეროსთვის
- გაზრდილი გამოქვითვები კვლევისთვის

### დღგ-ს ცვლილებები
- განახლებული რეგისტრაციის ლიმიტები
- ახალი ანგარიშგების მოთხოვნები
- გამარტივებული ანაზღაურების პროცედურები

## რეკომენდაციები

გადასახადის გადამხდელებმა უნდა:
- გადაიხედონ მიმდინარე სტრატეგიები
- განაახლონ ჩანაწერების სისტემები
- მიმართონ პროფესიონალებს`,
      authorType: 'SPECIALIST',
      authorId: specialistUser.id,
      companyId: specialistProfile.companyId,
      locale: 'ka',
      categories: ['legislation', 'legal-news'],
      tags: ['საგადასახადო სისტემა', 'რეფორმები', 'ბიზნესი', 'ფიზიკური პირები'],
    },
    // Admin posts
    {
      title: 'Legal Technology Trends in 2025',
      slug: 'legal-technology-trends-2025',
      excerpt: 'Exploring the latest trends in legal technology and their impact on the practice of law.',
      body: `# Legal Technology Trends in 2025

The legal industry continues to evolve rapidly with new technologies transforming how legal services are delivered.

## Emerging Technologies

### Artificial Intelligence
- Document review and analysis
- Predictive analytics for case outcomes
- Automated legal research

### Blockchain Applications
- Smart contracts
- Digital identity verification
- Secure document storage

### Cloud Computing
- Remote access to legal databases
- Collaborative case management
- Scalable infrastructure

## Impact on Legal Practice

### Efficiency Gains
- Reduced time for routine tasks
- Improved accuracy in document review
- Enhanced client communication

### New Challenges
- Data security concerns
- Ethical considerations
- Training requirements

## Future Outlook

Legal professionals must:
- Stay updated with technological advances
- Invest in appropriate tools
- Maintain ethical standards

## Conclusion

Technology is reshaping the legal landscape, offering both opportunities and challenges for practitioners.`,
      authorType: 'COMPANY',
      authorId: adminUser.id,
      companyId: companyUser.company.id,
      locale: 'en',
      categories: ['legal-news', 'case-studies'],
      tags: ['technology', 'AI', 'blockchain', 'legal practice'],
    },
    {
      title: 'იურიდიული ტექნოლოგიების ტენდენციები',
      slug: 'legal-tech-trends-georgia',
      excerpt: 'იურიდიული ტექნოლოგიების უახლესი ტენდენციები და მათი გავლენა სამართალზე.',
      body: `# იურიდიული ტექნოლოგიების ტენდენციები

იურიდიული ინდუსტრია სწრაფად იცვლება ახალი ტექნოლოგიების გავლენით.

## ახალი ტექნოლოგიები

### ხელოვნური ინტელექტი
- დოკუმენტების ანალიზი
- საქმის შედეგების პროგნოზირება
- ავტომატიზებული იურიდიული კვლევა

### ბლოკჩეინი
- ჭკვიანი კონტრაქტები
- ციფრული იდენტობის დადასტურება
- უსაფრთხო დოკუმენტების შენახვა

### ღრუბლოვანი გამოთვლები
- დისტანციური წვდომა ბაზებზე
- კოლაბორაციული მართვა
- მასშტაბირებადი ინფრასტრუქტურა

## გავლენა იურიდიულ პრაქტიკაზე

### ეფექტურობის ზრდა
- რუტინული ამოცანების შემცირება
- დოკუმენტების გაუმჯობესებული ანალიზი
- კლიენტებთან კომუნიკაციის გაუმჯობესება

### ახალი გამოწვევები
- მონაცემების უსაფრთხოება
- ეთიკური საკითხები
- ტრენინგის მოთხოვნები

## მომავალი პერსპექტივები

იურიდიულმა პროფესიონალებმა უნდა:
- იყვნენ განახლებული ტექნოლოგიური ცვლილებების შესახებ
- ინვესტირება გააკეთონ შესაბამის ინსტრუმენტებში
- შეინარჩუნონ ეთიკური სტანდარტები`,
      authorType: 'COMPANY',
      authorId: adminUser.id,
      companyId: companyUser.company.id,
      locale: 'ka',
      categories: ['legal-news', 'legal-advice'],
      tags: ['ტექნოლოგია', 'ხელოვნური ინტელექტი', 'ბლოკჩეინი', 'იურიდიული პრაქტიკა'],
    },
  ];

  // Create posts
  for (const postData of testPosts) {
    try {
      // Find category IDs
      const categoryIds = [];
      for (const categorySlug of postData.categories) {
        const category = categories.find(c => c.slug === categorySlug);
        if (category) {
          categoryIds.push(category.id);
        }
      }

      if (categoryIds.length === 0) {
        console.log(`Warning: No categories found for post: ${postData.title}`);
        continue;
      }

      // Create the post
      const post = await prisma.post.create({
        data: {
          title: postData.title,
          slug: postData.slug,
          excerpt: postData.excerpt,
          body: postData.body,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          authorType: postData.authorType,
          authorId: postData.authorId,
          companyId: postData.companyId,
          locale: postData.locale,
          readingTime: Math.ceil(postData.body.split(' ').length / 200), // Estimate reading time
          viewCount: Math.floor(Math.random() * 100),
          categories: {
            create: categoryIds.map(categoryId => ({
              categoryId,
            })),
          },
          tags: {
            create: postData.tags.map(tag => ({
              tag,
            })),
          },
        },
      });

      console.log(`✓ Created post: ${post.title} (${post.locale})`);
    } catch (error) {
      console.error(`Error creating post ${postData.title}:`, error.message);
    }
  }

  console.log('Test posts creation completed!');
}

async function main() {
  try {
    await createTestPosts();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
