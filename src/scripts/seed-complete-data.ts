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

interface Company {
  id: string;
  slug: string;
  name: string;
  services: string[];
  lawyers: string[];
}

async function main() {
  console.log("🌱 Starting complete data seeding...");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.practiceAreaTranslation.deleteMany();
  await prisma.serviceTranslation.deleteMany();
  await prisma.service.deleteMany();
  await prisma.practiceArea.deleteMany();
  await prisma.specialistProfile.deleteMany();
  await prisma.post.deleteMany();
  await prisma.media.deleteMany();
  await prisma.sliderSlide.deleteMany();

  // Load data from normalized files
  console.log("📖 Loading data from files...");
  const practiceAreasData = JSON.parse(
    readFileSync(join(process.cwd(), "data", "normalized.practice-areas.json"), "utf-8")
  ) as PracticeArea[];

  const servicesData = JSON.parse(
    readFileSync(join(process.cwd(), "data", "normalized.services.json"), "utf-8")
  ) as Service[];

  const specialistsData = JSON.parse(
    readFileSync(join(process.cwd(), "data", "normalized.lawyers.json"), "utf-8")
  ) as SpecialistProfile[];

  const companiesData = JSON.parse(
    readFileSync(join(process.cwd(), "data", "normalized.companies.json"), "utf-8")
  ) as Company[];

  // Create practice areas
  console.log("🏢 Creating practice areas...");
  for (const practiceArea of practiceAreasData) {
    if (!practiceArea.slug || practiceArea.slug.includes('__trashed')) continue;
    
    try {
      await prisma.practiceArea.create({
        data: {
          id: practiceArea.id,
          slug: practiceArea.slug,
          title: practiceArea.title,
          description: `Comprehensive legal services in ${practiceArea.title}`,
          heroImageUrl: `/practice/${practiceArea.slug}.webp`,
          translations: {
            create: [
              {
                locale: "ka",
                title: practiceArea.title,
                slug: practiceArea.slug,
                description: `${practiceArea.title} სფეროში იურიდიული მომსახურება`,
                metaTitle: `${practiceArea.title} - Legal Sandbox Georgia`,
                metaDescription: `პროფესიონალური იურიდიული მომსახურება ${practiceArea.title} სფეროში`,
              },
              {
                locale: "en",
                title: practiceArea.title,
                slug: practiceArea.slug,
                description: `Professional legal services in ${practiceArea.title}`,
                metaTitle: `${practiceArea.title} - Legal Sandbox Georgia`,
                metaDescription: `Expert legal services and consultation in ${practiceArea.title}`,
              },
              {
                locale: "ru",
                title: practiceArea.title,
                slug: practiceArea.slug,
                description: `Профессиональные юридические услуги в области ${practiceArea.title}`,
                metaTitle: `${practiceArea.title} - Legal Sandbox Georgia`,
                metaDescription: `Экспертные юридические услуги и консультации в области ${practiceArea.title}`,
              },
            ],
          },
        },
      });
      console.log(`✅ Created practice area: ${practiceArea.title}`);
    } catch (error) {
      console.log(`⚠️ Practice area already exists or error: ${practiceArea.title}`);
    }
  }

  // Create services
  console.log("⚖️ Creating services...");
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
          description: `Expert ${service.title} services`,
          heroImageUrl: `/practice/${practiceArea.slug}/${service.slug}.webp`,
          practiceAreaId: practiceArea.id,
          translations: {
            create: [
              {
                locale: "ka",
                title: service.title,
                slug: service.slug,
                description: `პროფესიონალური ${service.title} მომსახურება`,
                metaTitle: `${service.title} - Legal Sandbox Georgia`,
                metaDescription: `ექსპერტული ${service.title} მომსახურება და კონსულტაცია`,
              },
              {
                locale: "en",
                title: service.title,
                slug: service.slug,
                description: `Professional ${service.title} services`,
                metaTitle: `${service.title} - Legal Sandbox Georgia`,
                metaDescription: `Expert ${service.title} services and consultation`,
              },
              {
                locale: "ru",
                title: service.title,
                slug: service.slug,
                description: `Профессиональные услуги ${service.title}`,
                metaTitle: `${service.title} - Legal Sandbox Georgia`,
                metaDescription: `Экспертные услуги ${service.title} и консультации`,
              },
            ],
          },
        },
      });
      console.log(`✅ Created service: ${service.title}`);
    } catch (error) {
      console.log(`⚠️ Service already exists or error: ${service.title}`);
    }
  }

  // Create sample companies
  console.log("🏢 Creating sample companies...");
  const sampleCompanies = [
    {
      slug: "legal-georgia",
      name: "Legal Georgia",
      description: "Leading legal services provider in Georgia",
      shortDesc: "Your trusted legal partner",
      longDesc: "Legal Georgia is a premier law firm providing comprehensive legal services across various practice areas including corporate law, immigration, and litigation.",
      logoUrl: "/logos/01black.webp",
      website: "https://legal.ge",
      phone: "+995 32 123 4567",
      email: "info@legal.ge",
      address: "Tbilisi, Georgia",
      city: "Tbilisi",
    },
    {
      slug: "tbilisi-law-group",
      name: "Tbilisi Law Group",
      description: "Specialized legal services in Tbilisi",
      shortDesc: "Expert legal solutions",
      longDesc: "Tbilisi Law Group specializes in business law, real estate, and family law matters with a focus on client satisfaction and results.",
      logoUrl: "/logos/01gray.webp",
      website: "https://tbilisilaw.ge",
      phone: "+995 32 765 4321",
      email: "contact@tbilisilaw.ge",
      address: "Tbilisi, Georgia",
      city: "Tbilisi",
    }
  ];

  for (const company of sampleCompanies) {
    try {
      await prisma.company.create({
        data: company,
      });
      console.log(`✅ Created company: ${company.name}`);
    } catch (error) {
      console.log(`⚠️ Company already exists or error: ${company.name}`);
    }
  }

  // Create specialist profiles
  console.log("👨‍💼 Creating specialist profiles...");
  for (const specialist of specialistsData) {
    if (!specialist.slug || specialist.slug.includes('__trashed')) continue;
    
    const services = await prisma.service.findMany({
      where: { slug: { in: specialist.services } },
    });

    await prisma.specialistProfile.create({
      data: {
        id: specialist.id,
        slug: specialist.slug,
        name: specialist.name,
        role: "Senior Legal Counsel",
        bio: `Experienced legal professional specializing in multiple practice areas with ${specialist.services.length} years of expertise.`,
        languages: "[]",
        specializations: "[]",
        avatarUrl: `/uploads/specialists/${specialist.slug}.webp`,
        services: {
          connect: services.map(s => ({ id: s.id })),
        },
      },
    });
  }

  // Create sample posts
  console.log("📰 Creating sample posts...");
  const samplePosts = [
    {
      slug: "new-immigration-laws-2024",
      title: "New Immigration Laws in Georgia 2024",
      excerpt: "Recent changes to Georgia's immigration legislation and their impact on foreign nationals.",
      content: "Georgia has recently updated its immigration laws to streamline the process for foreign nationals...",
      date: new Date("2024-01-15"),
    },
    {
      slug: "startup-legal-checklist",
      title: "Essential Legal Checklist for Startups",
      excerpt: "A comprehensive guide to legal requirements for new businesses in Georgia.",
      content: "Starting a business in Georgia requires careful attention to legal compliance...",
      date: new Date("2024-01-10"),
    },
    {
      slug: "crypto-regulation-update",
      title: "Crypto Regulation Update in Georgia",
      excerpt: "Latest developments in cryptocurrency regulation and compliance requirements.",
      content: "The Georgian government has introduced new regulations for cryptocurrency businesses...",
      date: new Date("2024-01-05"),
    },
  ];

  for (const post of samplePosts) {
    await prisma.post.create({
      data: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImageUrl: `/uploads/posts/${post.slug}.webp`,
        date: post.date,
        status: 'PUBLISHED',
        authorId: 'admin-user-id', // We'll need to create an admin user first
      },
    });
  }

  // Create slider slides
  console.log("🎠 Creating slider slides...");
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
    await prisma.sliderSlide.create({
      data: slide,
    });
  }

  // Create sample media entries
  console.log("🖼️ Creating media entries...");
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
  ];

  for (const media of mediaEntries) {
    await prisma.media.create({
      data: media,
    });
  }

  // Get final counts
  const practiceAreaCount = await prisma.practiceArea.count();
  const serviceCount = await prisma.service.count();
  const companyCount = await prisma.company.count();
  const specialistCount = await prisma.specialistProfile.count();
  const postCount = await prisma.post.count();
  const slideCount = await prisma.sliderSlide.count();

  console.log("✅ Seeding completed successfully!");
  console.log(`📊 Created:`);
  console.log(`   - ${practiceAreaCount} practice areas`);
  console.log(`   - ${serviceCount} services`);
  console.log(`   - ${companyCount} companies`);
  console.log(`   - ${specialistCount} specialist profiles`);
  console.log(`   - ${postCount} blog posts`);
  console.log(`   - ${slideCount} slider slides`);
  console.log(`   - ${mediaEntries.length} media entries`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
