import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";

export default async function AdminLayout({
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
    role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "SPECIALIST" | "AUTHOR";
  };
  const user = session?.user as AppUser | undefined;
  if (!session || user?.role !== "SUPER_ADMIN") redirect(`/${locale}`);

  const base = `/${locale}/admin`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin CMS</h1>
        <nav className="flex items-center gap-2">
          <Link href={`${base}`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Dashboard
          </Link>
          <Link href={`${base}/practices`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Practices
          </Link>
          <Link href={`${base}/services`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Services
          </Link>
          <Link href={`${base}/lawyers`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Specialists
          </Link>
          <Link href={`${base}/companies`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Companies
          </Link>
          <Link href={`${base}/requests`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Requests
          </Link>
          <Link href={`${base}/posts`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Posts
          </Link>
          <Link href={`${base}/categories`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Categories
          </Link>
          <Link href={`${base}/slider`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Slider
          </Link>
          <Link href={`${base}/legal-pages`} className="rounded px-3 py-1.5 text-sm hover:bg-muted">
            Legal Pages
          </Link>
          {user?.email === "infolegalge@gmail.com" && (
            <Link href={`${base}/database`} className="rounded px-3 py-1.5 text-sm hover:bg-muted text-amber-600 dark:text-amber-400">
              Database
            </Link>
          )}
        </nav>
      </div>
      {children}
    </div>
  );
}

export const dynamic = "force-dynamic";


