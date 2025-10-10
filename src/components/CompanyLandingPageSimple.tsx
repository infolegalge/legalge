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
  Quote
} from "lucide-react";
import { OFFICIAL_PHONE, phoneToTelHref } from "@/config/contact";

interface CompanyLandingPageSimpleProps {
  company: Company;
  locale: Locale;
  t: (key: string) => string;
}

export default function CompanyLandingPageSimple({ company, locale, t }: CompanyLandingPageSimpleProps) {
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
                  href={phoneToTelHref(OFFICIAL_PHONE)}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium text-primary"
                >
                  {OFFICIAL_PHONE}
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
          <div className="prose prose-lg max-w-none text-muted-foreground whitespace-pre-line">
            {company.longDesc}
          </div>
        </div>
      )}

      {/* Mission / Vision / History / Prompt */}
      {(company.mission || company.vision || company.history || company.contactPrompt || company.socialLinks) && (
        <div className="mb-12 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {company.mission && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Quote className="h-5 w-5 text-primary" />
                  {t("companies.mission") || "Mission"}
                </h2>
                <p className="text-muted-foreground whitespace-pre-line">{company.mission}</p>
              </div>
            )}
            {company.vision && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold mb-3">{t("companies.vision") || "Vision"}</h2>
                <p className="text-muted-foreground whitespace-pre-line">{company.vision}</p>
              </div>
            )}
          </div>
          {company.history && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-3">{t("companies.history") || "History"}</h2>
              <p className="text-muted-foreground whitespace-pre-line">{company.history}</p>
            </div>
          )}
          {company.contactPrompt && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-3">{t("companies.contact_prompt") || "How we work"}</h2>
              <p className="text-muted-foreground whitespace-pre-line">{company.contactPrompt}</p>
            </div>
          )}
          {company.socialLinks && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-3">{t("companies.social_links") || "On the web"}</h2>
              <div className="flex flex-wrap gap-3">
                {(() => {
                  try {
                    const parsed = JSON.parse(company.socialLinks as string) as Array<{ label?: string; url?: string }>;
                    return parsed
                      .filter((link) => link?.url)
                      .map((link, index) => (
                  <a
                    key={index}
                        href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4 text-primary" />
                    {link.label || link.url}
                  </a>
                      ));
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </div>
          )}
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
        <div className="mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">{t("companies.specialists")}</h2>
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {company.specialists.length}
          </span>
        </div>

        {company.specialists.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {company.specialists.map((specialist) => (
              <Link
                key={specialist.id}
                href={`/${locale}/specialists/${specialist.slug}`}
                className="group block"
              >
                <div className="rounded-lg border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20">
                  <div className="flex items-start gap-4">
                    {specialist.avatarUrl ? (
                      <Image
                        src={specialist.avatarUrl}
                        alt={specialist.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-full object-cover"
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
            <h3 className="mt-4 text-lg font-semibold">{t("companies.no_specialists")}</h3>
            <p className="mt-2 text-muted-foreground">{t("companies.no_specialists_description")}</p>
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
