import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.RESET_EMAIL ?? "contact@legal.ge";
  const plain = process.env.RESET_PASSWORD ?? "295Att429";

  if (!plain) {
    throw new Error("RESET_PASSWORD env var is required");
  }

  const hashed = await bcrypt.hash(plain, 12);

  const updated = await prisma.user.updateMany({
    where: { email },
    data: { password: hashed },
  });

  if (updated.count === 0) {
    throw new Error(`No user found for email ${email}`);
  }

  console.log(`Password updated for ${email}`);
}

main()
  .catch((err) => {
    console.error("Failed to reset password", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

