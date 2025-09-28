import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function AdminPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & {
    role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR";
    companySlug?: string | null;
    lawyerSlug?: string | null;
  };
  const appUser = session?.user as AppUser | undefined;
  const role = appUser?.role;
  if (!session || role !== "SUPER_ADMIN") redirect(`/${locale}`);

  // Get dashboard statistics
  const [practiceAreasCount, servicesCount, specialistsCount, postsCount, requestStats] = await Promise.all([
    prisma.practiceArea.count(),
    prisma.service.count(),
    prisma.specialistProfile.count(),
    prisma.post.count(),
    prisma.request.aggregate({
      _count: {
        id: true
      },
      where: {
        status: "PENDING"
      }
    }).then(result => ({
      total: prisma.request.count(),
      pending: result._count.id
    }))
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-foreground/70">Welcome back, {session.user?.name || session.user?.email}</p>
        <p className="text-sm text-foreground/50">Role: {role}</p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Practice Areas</p>
              <p className="text-2xl font-bold">{practiceAreasCount}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Services</p>
              <p className="text-2xl font-bold">{servicesCount}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Specialists</p>
              <p className="text-2xl font-bold">{specialistsCount}</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Blog Posts</p>
              <p className="text-2xl font-bold">{postsCount}</p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Link href={`/${locale}/admin/practices`} className="rounded-lg border bg-card p-6 hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-blue-100 p-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Practice Areas</h3>
                <p className="text-sm text-muted-foreground">Edit practice areas and translations</p>
              </div>
            </div>
          </Link>

          <Link href={`/${locale}/admin/services`} className="rounded-lg border bg-card p-6 hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-green-100 p-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Services</h3>
                <p className="text-sm text-muted-foreground">Manage legal services</p>
              </div>
            </div>
          </Link>

          <Link href={`/${locale}/admin/lawyers`} className="rounded-lg border bg-card p-6 hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-purple-100 p-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Specialists</h3>
                <p className="text-sm text-muted-foreground">Edit specialist profiles</p>
              </div>
            </div>
          </Link>

          <Link href={`/${locale}/admin/companies`} className="rounded-lg border bg-card p-6 hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-indigo-100 p-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Companies</h3>
                <p className="text-sm text-muted-foreground">Manage company profiles</p>
              </div>
            </div>
          </Link>

          <Link href={`/${locale}/admin/requests`} className={`rounded-lg border p-6 hover:bg-muted/50 transition-all relative ${requestStats.pending > 0 ? 'bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' : 'bg-card'}`}>
            <div className="flex items-center space-x-3">
              <div className={`rounded-full p-2 ${requestStats.pending > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-yellow-100'}`}>
                <svg className={`h-5 w-5 ${requestStats.pending > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Requests</h3>
                  {requestStats.pending > 0 && (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {requestStats.pending} pending
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {requestStats.pending > 0 
                    ? `${requestStats.pending} pending request${requestStats.pending === 1 ? '' : 's'} need attention`
                    : 'No pending requests'
                  }
                </p>
              </div>
            </div>
            {requestStats.pending > 0 && (
              <div className="absolute -top-1 -right-1">
                <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </Link>

          <Link href={`/${locale}/admin/posts`} className="rounded-lg border bg-card p-6 hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-orange-100 p-2">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Blog Posts</h3>
                <p className="text-sm text-muted-foreground">Manage blog content</p>
              </div>
            </div>
          </Link>

          <Link href={`/${locale}/admin/slider`} className="rounded-lg border bg-card p-6 hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-teal-100 p-2">
                <svg className="h-5 w-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Slider</h3>
                <p className="text-sm text-muted-foreground">Edit homepage slider</p>
              </div>
            </div>
          </Link>

          {session.user?.email === "infolegalge@gmail.com" && (
            <Link href={`/${locale}/admin/database`} className="rounded-lg border border-amber-200 bg-card p-6 hover:bg-amber-50/50 dark:border-amber-800 dark:hover:bg-amber-950/20">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                  <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-amber-700 dark:text-amber-400">Database</h3>
                  <p className="text-sm text-muted-foreground">Database management</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Recent Practice Areas</h2>
        <div className="space-y-3">
          {(await prisma.practiceArea.findMany({ 
            take: 5, 
            orderBy: { createdAt: 'desc' },
            include: { translations: true }
          })).map((practice) => (
            <div key={practice.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <h4 className="font-medium">{practice.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {practice.translations.length} translations • {practice.slug}
                </p>
              </div>
              <Link 
                href={`/${locale}/admin/practices/${practice.id}`}
                className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


