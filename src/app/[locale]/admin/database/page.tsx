import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { PrismaClient } from "@prisma/client";
import DatabaseAccess from "@/components/admin/DatabaseAccess";

const prisma = new PrismaClient();

export default async function DatabasePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  
  // Verify super admin access
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & {
    role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR";
  };
  const user = session?.user as AppUser | undefined;
  
  if (!session || user?.role !== "SUPER_ADMIN" || user?.email !== "infolegalge@gmail.com") {
    redirect(`/${locale}/admin`);
  }

  // Get database statistics
  const stats = await getDatabaseStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Database Management</h1>
          <p className="text-muted-foreground">
            Direct access to the database for super admin only
          </p>
        </div>
      </div>

      {/* Database Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Practice Areas</h3>
          <p className="text-2xl font-bold text-primary">{stats.practiceAreas}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Services</h3>
          <p className="text-2xl font-bold text-primary">{stats.services}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Lawyers</h3>
          <p className="text-2xl font-bold text-primary">{stats.lawyers}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Posts</h3>
          <p className="text-2xl font-bold text-primary">{stats.posts}</p>
        </div>
      </div>

      {/* Interactive Database Access */}
      <DatabaseAccess 
        isSuperAdmin={user?.role === "SUPER_ADMIN"} 
        userEmail={user?.email} 
      />

      {/* System Information */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">System Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-medium">Database Details</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Type: SQLite (Development)</div>
              <div>Studio Port: 5556</div>
              <div>Access Level: Super Admin Only</div>
              <div>Current User: {user?.email}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Quick Commands</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Start Studio: <code className="rounded bg-muted px-1">npm run studio</code></div>
              <div>Direct Access: <code className="rounded bg-muted px-1">npx prisma studio --port 5556</code></div>
              <div>Database Push: <code className="rounded bg-muted px-1">npx prisma db push</code></div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 text-amber-600 dark:text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Security Notice
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Database access is restricted to super admin only. All changes are logged and monitored. 
              Use with caution as direct database modifications can affect the application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getDatabaseStats() {
  try {
    const [practiceAreas, services, lawyers, posts] = await Promise.all([
      prisma.practiceArea.count(),
      prisma.service.count(),
      prisma.specialistProfile.count(),
      prisma.post.count(),
    ]);

    return {
      practiceAreas,
      services,
      lawyers,
      posts,
    };
  } catch (error) {
    console.error("Error fetching database stats:", error);
    return {
      practiceAreas: 0,
      services: 0,
      lawyers: 0,
      posts: 0,
    };
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = "force-dynamic";
