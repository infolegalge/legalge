import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { fetchSpecialist } from "@/lib/specialists";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft,
  ExternalLink,
  Award,
  BookOpen,
  Users,
  Briefcase,
  Shield,
  Gavel,
  GraduationCap,
  Heart
} from "lucide-react";

interface SpecialistPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({ params }: SpecialistPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const specialist = await fetchSpecialist(slug, locale);
  
  if (!specialist) {
    return {
      title: "Specialist Not Found",
    };
  }

  return {
    title: `${specialist.name} - ${specialist.role || 'Legal Specialist'}`,
    description: specialist.bio || `Meet ${specialist.name}, a legal specialist at ${specialist.company?.name || 'our firm'}.`,
  };
}

export default async function SpecialistPage({ params }: SpecialistPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const specialistT = await getTranslations('specialist');
  
  const specialist = await fetchSpecialist(slug, locale);
  
  if (!specialist) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground">
          {t("common.home")}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/specialists`} className="hover:text-foreground">
          {t("specialists.title")}
        </Link>
        <span>/</span>
        <span className="text-foreground">{specialist.name}</span>
      </nav>

      {/* Back button */}
      <Link
        href={`/${locale}/specialists`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back_to_specialists")}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {specialist.avatarUrl ? (
              <Image
                src={specialist.avatarUrl}
                alt={specialist.name}
                width={200}
                height={200}
                className="h-48 w-48 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-muted">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{specialist.name}</h1>
            {specialist.role && (
              <p className="mt-2 text-xl text-muted-foreground">{specialist.role}</p>
            )}

            {/* Company or Solo Badge */}
            <div className="mt-4">
              {specialist.company ? (
                <div className="flex items-center gap-3">
                  {specialist.company.logoUrl ? (
                    <Image
                      src={specialist.company.logoUrl}
                      alt={specialist.company.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div>
                    <Link
                      href={`/${locale}/companies/${specialist.company.slug}`}
                      className="text-lg font-semibold text-primary hover:underline"
                    >
                      {specialist.company.name}
                    </Link>
                    {specialist.company.website && (
                      <a
                        href={specialist.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold text-primary">Solo Practitioner</span>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Link
                  href={`/${locale}/contact`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Contact us for consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specializations */}
      {specialist.services.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">{t("specialists.specializations")}</h2>
          <div className="flex flex-wrap gap-2">
            {specialist.services.map((service) => (
              <span
                key={service.id}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {service.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {specialist.languages.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">{specialistT("languages")}</h2>
          <div className="flex flex-wrap gap-2">
            {specialist.languages.map((lang, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {specialist.bio && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">{specialistT("bio")}</h2>
          <div 
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: specialist.bio }}
          />
        </div>
      )}

      {/* Philosophy Section */}
      {specialist.philosophy && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {specialistT("philosophy")}
          </h2>
          <div className="rounded-lg border bg-muted/30 p-6">
            <p className="text-muted-foreground leading-relaxed">
              {specialist.philosophy}
            </p>
          </div>
        </div>
      )}

      {/* Focus Areas */}
      {specialist.focusAreas && (() => {
        try {
          const focusAreas = JSON.parse(specialist.focusAreas);
          return focusAreas.length > 0 ? (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                {specialistT("focus_areas")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          ) : null;
        } catch {
          return null;
        }
      })()}

      {/* Representative Matters */}
      {specialist.representativeMatters && (() => {
        try {
          const matters = JSON.parse(specialist.representativeMatters);
          return matters.length > 0 ? (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {specialistT("representative_matters")}
              </h2>
              <div className="space-y-4">
                {matters.map((matter: string, index: number) => (
                  <div key={index} className="rounded-lg border p-4">
                    <p className="text-muted-foreground">
                      {matter}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        } catch {
          return null;
        }
      })()}

      {/* Teaching, Writing & Speaking */}
      {specialist.teachingWriting && (() => {
        try {
          const teachingData = JSON.parse(specialist.teachingWriting);
          return (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {specialistT("teaching_writing")}
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {teachingData.courses && teachingData.courses.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">{specialistT("courses")}</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {teachingData.courses.map((course: string, index: number) => (
                        <li key={index}>• {course}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {teachingData.workshops && teachingData.workshops.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">{specialistT("workshops")}</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {teachingData.workshops.map((workshop: string, index: number) => (
                        <li key={index}>• {workshop}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {teachingData.topics && teachingData.topics.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">{specialistT("writing_topics")}</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {teachingData.topics.map((topic: string, index: number) => (
                        <li key={index}>• {topic}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        } catch {
          return null;
        }
      })()}

      {/* Credentials & Memberships */}
      {specialist.credentials && (() => {
        try {
          const credentials = JSON.parse(specialist.credentials);
          return credentials.length > 0 ? (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                {specialistT("credentials")}
              </h2>
              <div className="rounded-lg border p-6">
                <ul className="space-y-2 text-muted-foreground">
                  {credentials.map((credential: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      {credential}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null;
        } catch {
          return null;
        }
      })()}

      {/* Values & How We Work */}
      {specialist.values && (() => {
        try {
          const values = JSON.parse(specialist.values);
          return Object.keys(values).length > 0 ? (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                {specialistT("values")}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(values).map(([key, value]) => (
                  <div key={key} className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2 text-primary">{key}</h3>
                    <p className="text-sm text-muted-foreground">
                      {value as string}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        } catch {
          return null;
        }
      })()}

      {/* Services */}
      {specialist.services.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">{t("specialists.services")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {specialist.services.map((service) => (
              <Link
                key={service.id}
                href={`/${locale}/services/${service.slug}`}
                className="rounded-lg border p-4 hover:bg-muted transition-colors"
              >
                <h3 className="font-medium text-foreground">{service.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Contact CTA */}
      <div className="rounded-lg border bg-muted/50 p-6">
        <div className="text-center mb-6">
          <h3 className="mb-2 text-lg font-semibold">Ready to Talk?</h3>
          <p className="text-muted-foreground">
            Book a free intro call or request a fixed‑fee quote. I&apos;ll respond the same business day with next steps and a proposed timeline.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="text-center">
            <h4 className="font-semibold mb-2">Contact & Booking</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Book a free 20‑min intro call</li>
              <li>• Request a fixed‑fee quote</li>
              <li>• WhatsApp/Telegram available upon request</li>
            </ul>
          </div>
          <div className="text-center">
            <h4 className="font-semibold mb-2">Work Modes</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Online worldwide</li>
              <li>• In‑person by appointment</li>
              <li>• Based in Tbilisi, Georgia</li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" />
            Contact Us
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Phone className="h-4 w-4" />
            Get Consultation
          </Link>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground italic">
            Download CV (PDF) available on request.
          </p>
        </div>
      </div>
    </div>
  );
}
