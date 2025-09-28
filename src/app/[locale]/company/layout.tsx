import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import type { Locale } from "@/i18n/locales";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <Guard locale={locale as Locale}>{children}</Guard>;
}

async function Guard({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & {
    role?: "SUPER_ADMIN" | "COMPANY" | "SPECIALIST" | "SUBSCRIBER";
  };
  const user = session?.user as AppUser | undefined;
  
  // Allow COMPANY users to access this area
  if (!session || user?.role !== "COMPANY") {
    redirect(`/${locale}`);
  }

  const base = `/${locale}/company`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Company Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your company profile and team</p>
        </div>
        <nav className="flex items-center gap-2">
          <Link href={`${base}`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Dashboard
          </Link>
          <Link href={`${base}/profile`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Company Profile
          </Link>
          <Link href={`${base}/lawyers`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Manage Specialists
          </Link>
          <Link href={`${base}/requests`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Specialist Requests
          </Link>
          <Link href={`${base}/bios`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Bio Approval
          </Link>
          <Link href={`${base}/posts`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Posts
          </Link>
          <Link href={`${base}/analytics`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Analytics
          </Link>
          <Link href={`${base}/categories`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Categories
          </Link>
          <Link href={`/${locale}`} className="rounded px-3 py-1.5 text-sm hover:bg-muted text-blue-600 dark:text-blue-400">
            ← Back to Site
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
      {children}
    </div>
  );
}

export const dynamic = "force-dynamic";

