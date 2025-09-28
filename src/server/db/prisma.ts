import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as {
  prismaGlobal: PrismaClient | undefined;
};

const prisma = globalForPrisma.prismaGlobal ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prismaGlobal = prisma;

export default prisma;






