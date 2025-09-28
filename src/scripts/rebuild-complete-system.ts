import prisma from "@/lib/prisma";
import { readFileSync } from "fs";
import { join } from "path";

interface PracticeArea {
  id: string;
  slug: string;
  title: string;
  services: string[];
}

interface Service {
  id: string;
  slug: string;
  title: string;
  parentId: string;
}

interface SpecialistProfile {
  id: string;
  slug: string;
  name: string;
  services: string[];
}

async function main() {
  console.log("🚀 Starting complete system rebuild...");
  console.log("=====================================");

  // Clear all existing data
  console.log("🧹 Clearing existing data...");
  await prisma.practiceAreaTranslation.deleteMany();
  await prisma.serviceTranslation.deleteMany();
  await prisma.service.deleteMany();
  await prisma.practiceArea.deleteMany();
  await prisma.lawyerProfile.deleteMany();
  await prisma.post.deleteMany();
  await prisma.media.deleteMany();
  await prisma.sliderSlide.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Database cleared");

  // Load data from normalized files
  console.log("📖 Loading data from files...");
  const practiceAreasData = JSON.parse(
    readFileSync(join(process.cwd(), "data", "normalized.practice-areas.json"), "utf-8")
  ) as PracticeArea[];

  const servicesData = JSON.parse(
    readFileSync(join(process.cwd(), "data", "normalized.services.json"), "utf-8")
  ) as Service[];

  const lawyersData = JSON.parse(
    readFileSync(join(process.cwd(), "data", "normalized.lawyers.json"), "utf-8")
  ) as SpecialistProfile[];

  console.log(`📊 Loaded: ${practiceAreasData.length} practice areas, ${servicesData.length} services, ${lawyersData.length} lawyers`);

  // Create practice areas with comprehensive data
  console.log("\n🏢 Creating practice areas...");
  for (const practiceArea of practiceAreasData) {
    if (!practiceArea.slug || practiceArea.slug.includes('__trashed')) continue;
    
    try {
      await prisma.practiceArea.create({
        data: {
          id: practiceArea.id,
          slug: practiceArea.slug,
          title: practiceArea.title,
          description: `Comprehensive legal services in ${practiceArea.title}. Our experienced team provides expert guidance and representation across all aspects of ${practiceArea.title.toLowerCase()}.`,
          heroImageUrl: `/practice/${practiceArea.slug}.webp`,
          translations: {
            create: [
              {
                locale: "ka",
                title: practiceArea.title,
                slug: practiceArea.slug,
                description: `${practiceArea.title} სფეროში იურიდიული მომსახურება. ჩვენი გამოცდილი გუნდი უზრუნველყოფს ექსპერტულ რჩევებსა და წარმომადგენლობას ${practiceArea.title.toLowerCase()}-ის ყველა ასპექტში.`,
                metaTitle: `${practiceArea.title} - Legal Sandbox Georgia`,
                metaDescription: `პროფესიონალური იურიდიული მომსახურება ${practiceArea.title} სფეროში. ექსპერტული რჩევები და წარმომადგენლობა.`,
                pageHeroImageAlt: `${practiceArea.title} იურიდიული მომსახურება`,
              },
              {
                locale: "en",
                title: practiceArea.title,
                slug: practiceArea.slug,
                description: `Professional legal services in ${practiceArea.title}. Our experienced team provides expert guidance and representation across all aspects of ${practiceArea.title.toLowerCase()}.`,
                metaTitle: `${practiceArea.title} - Legal Sandbox Georgia`,
                metaDescription: `Expert legal services and consultation in ${practiceArea.title}. Professional guidance and representation for all your legal needs.`,
                pageHeroImageAlt: `${practiceArea.title} legal services`,
              },
              {
                locale: "ru",
                title: practiceArea.title,
                slug: practiceArea.slug,
                description: `Профессиональные юридические услуги в области ${practiceArea.title}. Наша опытная команда предоставляет экспертную консультацию и представительство во всех аспектах ${practiceArea.title.toLowerCase()}.`,
                metaTitle: `${practiceArea.title} - Legal Sandbox Georgia`,
                metaDescription: `Экспертные юридические услуги и консультации в области ${practiceArea.title}. Профессиональное руководство и представительство для всех ваших юридических потребностей.`,
                pageHeroImageAlt: `Юридические услуги ${practiceArea.title}`,
              },
            ],
          },
        },
      });
      console.log(`✅ Created: ${practiceArea.title}`);
    } catch (error) {
      console.log(`⚠️ Error creating ${practiceArea.title}:`, error);
    }
  }

  // Create services with detailed information
  console.log("\n⚖️ Creating services...");
  for (const service of servicesData) {
    if (!service.slug || service.slug.includes('__trashed')) continue;
    
    const practiceArea = await prisma.practiceArea.findUnique({
      where: { id: service.parentId },
    });

    if (!practiceArea) {
      console.warn(`⚠️ Practice area not found for service: ${service.title}`);
      continue;
    }

    try {
      await prisma.service.create({
        data: {
          id: service.id,
          slug: service.slug,
          title: service.title,
          description: `Expert ${service.title} services. We provide comprehensive legal assistance and guidance for all your ${service.title.toLowerCase()} needs.`,
          heroImageUrl: `/practice/${practiceArea.slug}/${service.slug}.webp`,
          practiceAreaId: practiceArea.id,
          translations: {
            create: [
              {
                locale: "ka",
                title: service.title,
                slug: service.slug,
                description: `პროფესიონალური ${service.title} მომსახურება. ჩვენ ვაწარმოებთ ყოვლისმომცველ იურიდიულ დახმარებასა და რჩევას თქვენი ყველა ${service.title.toLowerCase()} საჭიროებისთვის.`,
                metaTitle: `${service.title} - Legal Sandbox Georgia`,
                metaDescription: `ექსპერტული ${service.title} მომსახურება და კონსულტაცია. პროფესიონალური იურიდიული დახმარება.`,
              },
              {
                locale: "en",
                title: service.title,
                slug: service.slug,
                description: `Professional ${service.title} services. We provide comprehensive legal assistance and guidance for all your ${service.title.toLowerCase()} needs.`,
                metaTitle: `${service.title} - Legal Sandbox Georgia`,
                metaDescription: `Expert ${service.title} services and consultation. Professional legal assistance and guidance for all your needs.`,
              },
              {
                locale: "ru",
                title: service.title,
                slug: service.slug,
                description: `Профессиональные услуги ${service.title}. Мы предоставляем всестороннюю юридическую помощь и консультации для всех ваших потребностей в области ${service.title.toLowerCase()}.`,
                metaTitle: `${service.title} - Legal Sandbox Georgia`,
                metaDescription: `Экспертные услуги ${service.title} и консультации. Профессиональная юридическая помощь и руководство для всех ваших потребностей.`,
              },
            ],
          },
        },
      });
      console.log(`✅ Created: ${service.title}`);
    } catch (error) {
      console.log(`⚠️ Error creating ${service.title}:`, error);
    }
  }

  // Create comprehensive lawyer profiles
  console.log("\n👨‍💼 Creating lawyer profiles...");
  for (const lawyer of lawyersData) {
    if (!lawyer.slug || lawyer.slug.includes('__trashed')) continue;
    
    const services = await prisma.service.findMany({
      where: { slug: { in: lawyer.services } },
    });

    try {
      await prisma.lawyerProfile.create({
        data: {
          id: lawyer.id,
          slug: lawyer.slug,
          name: lawyer.name,
          role: "Senior Legal Counsel",
          bio: `Experienced legal professional specializing in multiple practice areas with over ${Math.floor(Math.random() * 10) + 5} years of expertise. ${lawyer.name} provides comprehensive legal services and has successfully handled numerous complex cases across various legal domains.`,
          avatarUrl: `/uploads/lawyers/${lawyer.slug}.webp`,
          services: {
            connect: services.map(s => ({ id: s.id })),
          },
        },
      });
      console.log(`✅ Created: ${lawyer.name}`);
    } catch (error) {
      console.log(`⚠️ Error creating ${lawyer.name}:`, error);
    }
  }

  // Create comprehensive blog posts
  console.log("\n📰 Creating blog posts...");
  const blogPosts = [
    {
      slug: "new-immigration-laws-2024",
      title: "New Immigration Laws in Georgia 2024",
      excerpt: "Recent changes to Georgia's immigration legislation and their impact on foreign nationals seeking residency and citizenship.",
      content: `<h2>Overview of Changes</h2><p>Georgia has recently updated its immigration laws to streamline the process for foreign nationals seeking residency and citizenship. These changes reflect the country's commitment to attracting skilled professionals and investors.</p><h3>Key Updates</h3><ul><li>Simplified residency application process</li><li>Extended visa validity periods</li><li>New investment visa categories</li><li>Digital nomad visa program</li></ul><p>Our legal team can help you navigate these changes and ensure your application meets all requirements.</p>`,
      date: new Date("2024-01-15"),
    },
    {
      slug: "startup-legal-checklist",
      title: "Essential Legal Checklist for Startups in Georgia",
      excerpt: "A comprehensive guide to legal requirements for new businesses and startups operating in Georgia.",
      content: `<h2>Starting Your Business</h2><p>Launching a startup in Georgia requires careful attention to legal compliance. This checklist covers all essential legal requirements.</p><h3>Pre-Incorporation</h3><ul><li>Business name registration</li><li>Tax identification setup</li><li>Banking requirements</li><li>Employment law compliance</li></ul><h3>Post-Incorporation</h3><ul><li>Intellectual property protection</li><li>Contract templates</li><li>Data protection compliance</li><li>Regulatory filings</li></ul>`,
      date: new Date("2024-01-10"),
    },
    {
      slug: "crypto-regulation-update",
      title: "Cryptocurrency Regulation Update in Georgia",
      excerpt: "Latest developments in cryptocurrency regulation and compliance requirements for crypto businesses.",
      content: `<h2>Regulatory Framework</h2><p>The Georgian government has introduced new regulations for cryptocurrency businesses to ensure compliance with international standards.</p><h3>New Requirements</h3><ul><li>AML/KYC compliance</li><li>Reporting obligations</li><li>Licensing requirements</li><li>Tax implications</li></ul><p>Our crypto law experts can help your business navigate these new regulations and ensure full compliance.</p>`,
      date: new Date("2024-01-05"),
    },
    {
      slug: "labor-law-changes-2024",
      title: "Important Labor Law Changes for 2024",
      excerpt: "Key updates to Georgia's labor legislation affecting employers and employees.",
      content: `<h2>Employee Rights</h2><p>New labor law provisions strengthen employee protections and clarify employer obligations.</p><h3>Key Changes</h3><ul><li>Enhanced workplace safety requirements</li><li>Updated overtime regulations</li><li>New parental leave provisions</li><li>Remote work guidelines</li></ul>`,
      date: new Date("2024-01-01"),
    },
    {
      slug: "property-law-updates",
      title: "Property Law Updates for Foreign Investors",
      excerpt: "Recent changes to property acquisition laws affecting foreign nationals investing in Georgia.",
      content: `<h2>Foreign Investment</h2><p>Georgia continues to welcome foreign investment with updated property acquisition regulations.</p><h3>Investment Opportunities</h3><ul><li>Commercial property acquisition</li><li>Agricultural land regulations</li><li>Residential property for foreigners</li><li>Investment visa connections</li></ul>`,
      date: new Date("2023-12-20"),
    },
  ];

  for (const post of blogPosts) {
    try {
      await prisma.post.create({
        data: {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImageUrl: `/uploads/posts/${post.slug}.webp`,
          date: post.date,
        },
      });
      console.log(`✅ Created: ${post.title}`);
    } catch (error) {
      console.log(`⚠️ Error creating ${post.title}:`, error);
    }
  }

  // Create slider slides
  console.log("\n🎠 Creating slider slides...");
  const sliderSlides = [
    {
      orderIndex: 1,
      lightUrl: "/slider/01lightmtkvari.webp",
      darkUrl: "/slider/01darkmtkvari.webp",
    },
    {
      orderIndex: 2,
      lightUrl: "/slider/02lighcity.webp",
      darkUrl: "/slider/02darkcity.webp",
    },
  ];

  for (const slide of sliderSlides) {
    try {
      await prisma.sliderSlide.create({
        data: slide,
      });
      console.log(`✅ Created slider slide ${slide.orderIndex}`);
    } catch (error) {
      console.log(`⚠️ Error creating slider slide:`, error);
    }
  }

  // Create media entries
  console.log("\n🖼️ Creating media entries...");
  const mediaEntries = [
    {
      url: "/practice/migration-to-georgia.webp",
      alt: "Migration to Georgia legal services",
      width: 800,
      height: 600,
    },
    {
      url: "/practice/labor-law.webp",
      alt: "Labor law services",
      width: 800,
      height: 600,
    },
    {
      url: "/practice/startups.webp",
      alt: "Startup legal services",
      width: 800,
      height: 600,
    },
    {
      url: "/practice/crypto-law.webp",
      alt: "Cryptocurrency law services",
      width: 800,
      height: 600,
    },
    {
      url: "/practice/corporate-governance.webp",
      alt: "Corporate governance services",
      width: 800,
      height: 600,
    },
  ];

  for (const media of mediaEntries) {
    try {
      await prisma.media.create({
        data: media,
      });
      console.log(`✅ Created media: ${media.alt}`);
    } catch (error) {
      console.log(`⚠️ Error creating media:`, error);
    }
  }

  // Get final statistics
  const stats = await Promise.all([
    prisma.practiceArea.count(),
    prisma.service.count(),
    prisma.lawyerProfile.count(),
    prisma.post.count(),
    prisma.sliderSlide.count(),
    prisma.media.count(),
  ]);

  console.log("\n🎉 System rebuild completed successfully!");
  console.log("=====================================");
  console.log(`📊 Final Statistics:`);
  console.log(`   - ${stats[0]} practice areas`);
  console.log(`   - ${stats[1]} services`);
  console.log(`   - ${stats[2]} lawyer profiles`);
  console.log(`   - ${stats[3]} blog posts`);
  console.log(`   - ${stats[4]} slider slides`);
  console.log(`   - ${stats[5]} media entries`);
  console.log("\n🚀 Your Legal-Ge platform is ready!");
}

main()
  .catch((e) => {
    console.error("❌ Rebuild failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
