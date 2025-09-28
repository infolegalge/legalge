import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";

export default async function SpecialistLayout({
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
  const allowedRoles = ["SPECIALIST", "SUPER_ADMIN"];
  if (!session || !user?.role || !allowedRoles.includes(user.role)) redirect(`/${locale}`);

  const base = `/${locale}/specialist`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Specialist Account</h1>
          <p className="text-sm text-muted-foreground">Manage your professional profile and content</p>
        </div>
        <nav className="flex items-center gap-2">
          <Link href={`${base}`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Dashboard
          </Link>
          <Link href={`${base}/profile`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Profile
          </Link>
          <Link href={`${base}/posts`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Posts
          </Link>
          <Link href={`/${locale}`} className="rounded px-3 py-1.5 text-sm hover:bg-muted text-blue-600 dark:text-blue-400">
            ← Back to Site
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

export const dynamic = "force-dynamic";

