import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import { Plus, Building2, Users, FileText } from "lucide-react";
import CompaniesList from "./CompaniesList";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & { role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR" };
  const role = (session?.user as AppUser)?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
}



export default async function CompaniesAdmin({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  const { locale } = await params;
  
  const [companies, companiesCount] = await Promise.all([
    prisma.company.findMany({
      include: {
        _count: {
          select: {
            specialists: true,
            posts: true
          }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.company.count()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies Management</h1>
          <p className="text-muted-foreground">Manage legal companies and their profiles</p>
        </div>
        <Link
          href={`/${locale}/admin/companies/new`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Total Companies</p>
              <p className="text-2xl font-bold">{companiesCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Total Specialists</p>
              <p className="text-2xl font-bold">
                {companies.reduce((sum, company) => sum + company._count.specialists, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Total Posts</p>
              <p className="text-2xl font-bold">
                {companies.reduce((sum, company) => sum + company._count.posts, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Companies</h2>
          
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No companies found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first company.
              </p>
              <div className="mt-6">
                <Link
                  href={`/${locale}/admin/companies/new`}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Company
                </Link>
              </div>
            </div>
          ) : (
            <CompaniesList companies={companies} locale={locale} />
          )}
        </div>
      </div>
    </div>
  );
}
