"use client";

import Image from "next/image";
import Link from "next/link";
import type { Company } from "@/lib/specialists";
import type { Locale } from "@/i18n/locales";
import { 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  ExternalLink,
  Calendar,
  ArrowRight,
  Search
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface CompanyLandingPageProps {
  company: Company;
  locale: Locale;
}

export default function CompanyLandingPage({ company, locale }: CompanyLandingPageProps) {
  const t = useTranslations();
  const [specialistFilter, setSpecialistFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter specialists based on search and filter
  const filteredSpecialists = company.specialists.filter(specialist => {
    const matchesSearch = searchQuery === "" || 
      specialist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = specialistFilter === "all" || 
      specialist.specializations.some(spec => spec.toLowerCase().includes(specialistFilter.toLowerCase()));
    
    return matchesSearch && matchesFilter;
  });

  // Get unique specializations for filter
  const allSpecializations = Array.from(
    new Set(company.specialists.flatMap(s => s.specializations))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* 1. Header / Identity Block */}
      <div className="mb-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Logo and Basic Info */}
          <div className="flex-shrink-0">
            {company.logoUrl ? (
              <Image
                src={company.logoUrl}
                alt={company.logoAlt || company.name}
                width={200}
                height={200}
                className="h-48 w-48 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-4">{company.name}</h1>
            
            {/* Tagline */}
            {company.shortDesc && (
              <p className="text-xl text-muted-foreground mb-6">{company.shortDesc}</p>
            )}

            {/* Contact Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <a
                  href="tel:+995598295429"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  +995 598 295 429
                </a>
              </div>
              
              {company.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <a
                    href={`mailto:${company.email}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {company.email}
                  </a>
                </div>
              )}
              
              {company.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              
              {company.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  {company.mapLink ? (
                    <a
                      href={company.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {company.address}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">{company.address}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. About Section */}
      {company.longDesc && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t("companies.about")}</h2>
          <div 
            className="prose prose-lg max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: company.longDesc }}
          />
        </div>
      )}

      {/* Practice Areas Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">{t("companies.practice_areas")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(new Set(company.specialists.flatMap(s => s.specializations))).map((specialization, index) => (
            <Link
              key={index}
              href={`/${locale}/practice#${specialization.toLowerCase().replace(/\s+/g, '-')}`}
              className="rounded-lg border p-4 hover:bg-muted transition-colors"
            >
              <h3 className="font-medium text-foreground">{specialization}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Specialists Block */}
      <div className="mb-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">{t("companies.specialists")}</h2>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {company.specialists.length}
            </span>
          </div>

          {/* Filter and Search */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("companies.search_specialists")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64"
              />
            </div>
            <select
              value={specialistFilter}
              onChange={(e) => setSpecialistFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">{t("companies.all_specializations")}</option>
              {allSpecializations.map((spec, index) => (
                <option key={index} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredSpecialists.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSpecialists.map((specialist) => (
              <Link
                key={specialist.id}
                href={`/${locale}/specialists/${specialist.slug}`}
                className="group block"
              >
                <div className="rounded-lg border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20">
                  <div className="flex items-start gap-4">
                    {specialist.company?.logoUrl ? (
                      <Image
                        src={specialist.company.logoUrl}
                        alt={specialist.company.logoAlt || specialist.company.name}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {specialist.name}
                      </h3>
                      {specialist.role && (
                        <p className="text-sm text-muted-foreground mt-1">{specialist.role}</p>
                      )}
                      
                      {/* Specializations */}
                      {specialist.specializations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {specialist.specializations.slice(0, 2).map((spec, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {spec}
                            </span>
                          ))}
                          {specialist.specializations.length > 2 && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                              +{specialist.specializations.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t("companies.no_specialists_found")}</h3>
            <p className="mt-2 text-muted-foreground">{t("companies.no_specialists_found_description")}</p>
          </div>
        )}
      </div>

      {/* 4. News & Posts Block */}
      {company.posts.length > 0 && (
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {t("companies.latest_updates")} {company.name}
            </h2>
            <Link
              href={`/${locale}/news?company=${company.slug}`}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {t("companies.see_all_posts")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {company.posts.slice(0, 3).map((post) => (
              <Link
                key={post.id}
                href={`/${locale}/news/${post.slug}`}
                className="group block"
              >
                <div className="rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
                  {post.coverImage && (
                    <div className="aspect-video relative">
                      <Image
                        src={post.coverImage}
                        alt={post.coverImageAlt || post.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    {post.publishedAt && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 5. Call to Action */}
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <h3 className="text-2xl font-semibold mb-4">{t("companies.contact_cta_title")}</h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          {t("companies.contact_cta_description")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/${locale}/contact?company=${company.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" />
            {t("companies.contact_company")}
          </Link>
          <Link
            href={`/${locale}/contact?company=${company.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Phone className="h-4 w-4" />
            {t("companies.schedule_consultation")}
          </Link>
        </div>
      </div>
    </div>
  );
}
