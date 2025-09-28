import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping of practice area slugs to their hero images
const practiceHeroImages: Record<string, string> = {
  "migration-to-georgia": "/practice/1. Migration 1.webp",
  "labor-law": "/practice/02. Labour.webp",
  "legallaunch-for-startups": "/practice/3. Startups.webp",
  "crypto-law": "/practice/4. Crypto.webp",
  "corporate-governance-and-business-compliance": "/practice/5. BUsiness.webp",
  "licenses": "/practice/6. Licenses.webp",
  "permits": "/practice/7. Permits.webp",
  "tax-and-accounting": "/practice/8. Tax.webp",
  "banks-and-finances": "/practice/9. Banks.webp",
  "ip-trademark-inventions": "/practice/10. IP.webp",
  "personal-data-protection": "/practice/11. Personal data.webp",
  "property-law": "/practice/12. Property.webp",
  "honor-reputation-protection": "/practice/13. Honor and Business.webp",
  "international-law": "/practice/14. International.webp",
  "litigation-and-dispute-resolution": "/practice/15. Litigation.webp",
};

async function updatePracticeHeroImages() {
  try {
    console.log("🖼️  Updating practice area hero images...\n");

    let updatedCount = 0;

    for (const [slug, imageUrl] of Object.entries(practiceHeroImages)) {
      try {
        const updated = await prisma.practiceArea.update({
          where: { slug },
          data: { pageHeroImageUrl: imageUrl },
        });

        console.log(`✅ Updated ${slug}: ${imageUrl}`);
        updatedCount++;
      } catch (error) {
        console.log(`⚠️  Practice area not found: ${slug}`);
      }
    }

    console.log(`\n🎯 Summary:`);
    console.log(`✅ Updated ${updatedCount} practice areas with hero images`);
    console.log(`📁 Images are located in: /public/practice/`);
    
    // Show all practice areas for verification
    const allPractices = await prisma.practiceArea.findMany({
      select: { slug: true, pageHeroImageUrl: true },
    });

    console.log(`\n📋 Current practice areas:`);
    allPractices.forEach(practice => {
      const status = practice.pageHeroImageUrl ? "🖼️" : "❌";
      console.log(`   ${status} ${practice.slug}: ${practice.pageHeroImageUrl || "No image"}`);
    });

  } catch (error) {
    console.error("❌ Error updating practice hero images:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePracticeHeroImages();
