import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const PORT = 5556;

async function startPrismaStudio() {
  console.log("🚀 Starting Prisma Studio on port", PORT);
  
  // Check if database exists
  const dbPath = join(process.cwd(), "prisma", "dev.db");
  if (!existsSync(dbPath)) {
    console.error("❌ Database not found at:", dbPath);
    console.log("Please run 'npx prisma db push' first to create the database.");
    process.exit(1);
  }

  // Start Prisma Studio
  const studio = spawn("npx", ["prisma", "studio", "--port", PORT.toString()], {
    stdio: "inherit",
    shell: true,
  });

  studio.on("error", (error) => {
    console.error("❌ Failed to start Prisma Studio:", error);
    process.exit(1);
  });

  studio.on("close", (code) => {
    console.log(`Prisma Studio exited with code ${code}`);
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping Prisma Studio...");
    studio.kill("SIGINT");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Stopping Prisma Studio...");
    studio.kill("SIGTERM");
    process.exit(0);
  });

  console.log(`✅ Prisma Studio is starting on http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop");
}

startPrismaStudio();
