import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.CREATE_EMAIL ?? "contact@legal.ge";
  const plain = process.env.CREATE_PASSWORD ?? "295Att429";
  const role = (process.env.CREATE_ROLE ?? "SUPER_ADMIN") as Role;
  const name = process.env.CREATE_NAME ?? "Legal Sandbox";

  if (!plain) {
    throw new Error("CREATE_PASSWORD env var is required");
  }

  const hashed = await bcrypt.hash(plain, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      role,
      name,
    },
    create: {
      email,
      name,
      role,
      password: hashed,
    },
  });

  console.log(`User ensured: ${user.email} (role ${user.role})`);
}

main()
  .catch((err) => {
    console.error("Failed to create user", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

