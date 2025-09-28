import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Remove translations first due to FK constraints
  await prisma.serviceTranslation.deleteMany({});
  // Disconnect specialists from services (many-to-many)
  // Prisma needs explicit deleteMany on join table if modeled; here relations are implicit
  await prisma.$executeRawUnsafe(`DELETE FROM _ServiceToSpecialistProfile`);
  // Delete services
  await prisma.service.deleteMany({});
  console.log('All services and service translations deleted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





