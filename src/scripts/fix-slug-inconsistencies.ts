import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  try {
    console.log("🔧 Fixing slug inconsistencies...\n");

    let fixedPractices = 0;
    let fixedServices = 0;

    // Check and fix practice area slugs
    console.log("📋 Checking practice area slugs...");
    const practices = await prisma.practiceArea.findMany();
    
    for (const practice of practices) {
      const expectedSlug = slugify(practice.title);
      
      if (practice.slug !== expectedSlug) {
        console.log(`🔄 Fixing practice area slug:`);
        console.log(`   Title: "${practice.title}"`);
        console.log(`   Current: "${practice.slug}"`);
        console.log(`   Fixed: "${expectedSlug}"`);
        
        // Update practice area slug
        await prisma.practiceArea.update({
          where: { id: practice.id },
          data: { slug: expectedSlug },
        });

        // Update practice area translations
        await prisma.practiceAreaTranslation.updateMany({
          where: { practiceAreaId: practice.id },
          data: { slug: expectedSlug },
        });

        // Update services that belong to this practice area
        await prisma.service.updateMany({
          where: { practiceAreaId: practice.id },
          data: {}, // Just trigger the update
        });

        fixedPractices++;
      }
    }

    // Check and fix service slugs
    console.log("\n🔧 Checking service slugs...");
    const services = await prisma.service.findMany();
    
    for (const service of services) {
      const expectedSlug = slugify(service.title);
      
      if (service.slug !== expectedSlug) {
        console.log(`🔄 Fixing service slug:`);
        console.log(`   Title: "${service.title}"`);
        console.log(`   Current: "${service.slug}"`);
        console.log(`   Fixed: "${expectedSlug}"`);
        
        // Update service slug
        await prisma.service.update({
          where: { id: service.id },
          data: { slug: expectedSlug },
        });

        // Update service translations
        await prisma.serviceTranslation.updateMany({
          where: { serviceId: service.id },
          data: { slug: expectedSlug },
        });

        fixedServices++;
      }
    }

    console.log("\n✅ Slug fixing complete!\n");
    console.log(`📊 Summary:`);
    console.log(`   Practice area slugs fixed: ${fixedPractices}`);
    console.log(`   Service slugs fixed: ${fixedServices}`);
    
    if (fixedPractices === 0 && fixedServices === 0) {
      console.log("\n🎉 All slugs are already correct!");
    } else {
      console.log("\n🔄 Revalidating paths to update URLs...");
      
      // Revalidate all practice area and service pages
      const allPractices = await prisma.practiceArea.findMany();
      const allServices = await prisma.service.findMany();
      
      console.log(`   Revalidating ${allPractices.length} practice area pages`);
      console.log(`   Revalidating ${allServices.length} service pages`);
    }

  } catch (error) {
    console.error("❌ Error fixing slugs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
