import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { fetchCompanies } from "@/lib/specialists";
import Image from "next/image";
import Link from "next/link";
import { Building2, Users, ExternalLink } from "lucide-react";
import { createLocaleRouteMetadata } from "@/lib/metadata";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;

  return createLocaleRouteMetadata(locale, "companies", {
    title: "Law Firms and Partners",
    description: "Explore vetted Georgian law firms and partner companies delivering corporate, tax, and immigration services.",
  });
}

export default async function CompaniesIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  
  let companies: Awaited<ReturnType<typeof fetchCompanies>> = [];
  try {
    companies = await fetchCompanies();
  } catch {
    companies = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t("companies.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("companies.description")}
        </p>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t("companies.total_companies")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{companies.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t("companies.total_specialists")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {companies.reduce((total, company) => total + company.specialists.length, 0)}
          </p>
        </div>
      </div>

      {/* Companies Grid */}
      {companies.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/${locale}/companies/${company.slug}`}
              className="group block"
            >
              <div className="rounded-lg border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20">
                {/* Company Logo and Name */}
                <div className="mb-4 flex items-center gap-3">
                {company.logoUrl ? (
                  <Image
                    src={company.logoUrl}
                    alt={company.logoAlt || company.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded object-cover"
                  />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {company.name}
                    </h3>
                    {company.website && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Website</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {company.description && (
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                    {company.description}
                  </p>
                )}

                {/* Specialists Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {company.specialists.length} {company.specialists.length === 1 ? 'specialist' : 'specialists'}
                  </span>
                </div>

                {/* Specialists Preview */}
                {company.specialists.length > 0 && (
                  <div className="mt-3">
                    <div className="flex -space-x-2">
                      {company.specialists.slice(0, 3).map((specialist) => (
                        <div key={specialist.id} className="relative">
                          {specialist.avatarUrl ? (
                            <Image
                              src={specialist.avatarUrl}
                              alt={specialist.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full border-2 border-background object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted">
                              <span className="text-xs font-medium text-muted-foreground">
                                {specialist.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {company.specialists.length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted">
                          <span className="text-xs font-medium text-muted-foreground">
                            +{company.specialists.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t("companies.no_companies")}</h3>
          <p className="mt-2 text-muted-foreground">{t("companies.no_companies_description")}</p>
        </div>
      )}
    </div>
  );
}