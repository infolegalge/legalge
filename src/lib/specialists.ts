import prisma from "./prisma";
import type { Locale } from "@/i18n/locales";

export interface SpecialistProfile {
  id: string;
  slug: string;
  name: string;
  role?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  languages: string[];
  specializations: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  city?: string | null;
  companyId?: string | null;
  philosophy?: string | null;
  focusAreas?: string | null;
  representativeMatters?: string | null;
  teachingWriting?: string | null;
  credentials?: string | null;
  values?: string | null;
  company?: {
    id: string;
    slug: string;
    name: string;
    logoUrl?: string | null;
    logoAlt?: string | null;
    website?: string | null;
    city?: string | null;
  };
  services: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  shortDesc?: string | null;
  longDesc?: string | null;
  logoUrl?: string | null;
  logoAlt?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  mapLink?: string | null;
  specialists: SpecialistProfile[];
  posts: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt?: string | null;
    coverImage?: string | null;
    coverImageAlt?: string | null;
    publishedAt?: Date | null;
  }>;
}

export async function fetchSpecialists(): Promise<SpecialistProfile[]> {
  const specialists = await prisma.specialistProfile.findMany({
    include: {
      company: true,
      services: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
      translations: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return specialists.map((specialist) => ({
    id: specialist.id,
    slug: specialist.slug,
    name: specialist.name,
    role: specialist.role ?? null,
    bio: specialist.bio ?? null,
    avatarUrl: specialist.avatarUrl ?? null,
    languages: JSON.parse(specialist.languages || "[]"),
    specializations: JSON.parse(specialist.specializations || "[]"),
    contactEmail: specialist.contactEmail ?? null,
    contactPhone: specialist.contactPhone ?? null,
    city: specialist.city ?? null,
    companyId: specialist.companyId ?? null,
    philosophy: specialist.philosophy ?? null,
    focusAreas: specialist.focusAreas ?? null,
    representativeMatters: specialist.representativeMatters ?? null,
    teachingWriting: specialist.teachingWriting ?? null,
    credentials: specialist.credentials ?? null,
    values: specialist.values ?? null,
    company: specialist.company
      ? {
          id: specialist.company.id,
          slug: specialist.company.slug,
          name: specialist.company.name,
          logoUrl: specialist.company.logoUrl ?? null,
          logoAlt: specialist.company.logoAlt ?? null,
          website: specialist.company.website ?? null,
          city: specialist.company.city ?? null,
        }
      : undefined,
    services: specialist.services,
  }));
}

export async function fetchSpecialist(
  slug: string,
  locale?: Locale,
): Promise<SpecialistProfile | null> {
  const specialist = await prisma.specialistProfile.findUnique({
    where: { slug },
    include: {
      company: true,
      services: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
      translations: true,
    },
  });

  if (!specialist) return null;

  const translation = locale
    ? specialist.translations.find((t) => t.locale === locale)
    : null;

  const mergeJsonField = (baseValue: string | null | undefined, translatedValue: string | null | undefined) => {
    if (!translatedValue) return baseValue ?? null;
    return translatedValue;
  };

  const mergeTextField = (baseValue: string | null | undefined, translatedValue: string | null | undefined) => {
    if (translatedValue && translatedValue.trim().length > 0) {
      return translatedValue;
    }
    return baseValue ?? null;
  };

  const mergedPhilosophy = mergeTextField(specialist.philosophy, translation?.philosophy);
  const mergedFocusAreas = mergeJsonField(specialist.focusAreas, translation?.focusAreas);
  const mergedRepresentativeMatters = mergeJsonField(
    specialist.representativeMatters,
    translation?.representativeMatters,
  );
  const mergedTeachingWriting = mergeJsonField(specialist.teachingWriting, translation?.teachingWriting);
  const mergedCredentials = mergeJsonField(specialist.credentials, translation?.credentials);
  const mergedValues = mergeJsonField(specialist.values, translation?.values);

  return {
    id: specialist.id,
    slug: specialist.slug,
    name: mergeTextField(specialist.name, translation?.name) ?? specialist.name,
    role: mergeTextField(specialist.role, translation?.role),
    bio: mergeTextField(specialist.bio, translation?.bio),
    avatarUrl: specialist.avatarUrl ?? null,
    languages: JSON.parse(specialist.languages || "[]"),
    specializations: JSON.parse(specialist.specializations || "[]"),
    contactEmail: specialist.contactEmail ?? null,
    contactPhone: specialist.contactPhone ?? null,
    city: specialist.city ?? null,
    companyId: specialist.companyId ?? null,
    philosophy: mergedPhilosophy,
    focusAreas: mergedFocusAreas,
    representativeMatters: mergedRepresentativeMatters,
    teachingWriting: mergedTeachingWriting,
    credentials: mergedCredentials,
    values: mergedValues,
    company: specialist.company
      ? {
          id: specialist.company.id,
          slug: specialist.company.slug,
          name: specialist.company.name,
          logoUrl: specialist.company.logoUrl ?? null,
          logoAlt: specialist.company.logoAlt ?? null,
          website: specialist.company.website ?? null,
          city: specialist.company.city ?? null,
        }
      : undefined,
    services: specialist.services,
  };
}

export async function fetchCompanies(): Promise<Company[]> {
  const companies = await prisma.company.findMany({
    include: {
      specialists: {
        include: {
          services: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
      },
      posts: {
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          coverImageAlt: true,
          publishedAt: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 3,
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return companies.map((company) => ({
    id: company.id,
    slug: company.slug,
    name: company.name,
    description: company.description ?? null,
    shortDesc: company.shortDesc ?? null,
    longDesc: company.longDesc ?? null,
    logoUrl: company.logoUrl ?? null,
    logoAlt: company.logoAlt ?? null,
    website: company.website ?? null,
    phone: company.phone ?? null,
    email: company.email ?? null,
    address: company.address ?? null,
    city: company.city ?? null,
    mapLink: company.mapLink ?? null,
    posts: company.posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      coverImageAlt: (post as any).coverImageAlt ?? null,
      publishedAt: post.publishedAt,
    })),
    specialists: company.specialists.map((specialist) => ({
      id: specialist.id,
      slug: specialist.slug,
      name: specialist.name,
      role: specialist.role ?? null,
      bio: specialist.bio ?? null,
      avatarUrl: specialist.avatarUrl ?? null,
      languages: JSON.parse(specialist.languages || "[]"),
      specializations: JSON.parse(specialist.specializations || "[]"),
      contactEmail: specialist.contactEmail ?? null,
      contactPhone: specialist.contactPhone ?? null,
      city: specialist.city ?? null,
      companyId: specialist.companyId ?? null,
      company: {
        id: company.id,
        slug: company.slug,
        name: company.name,
        logoUrl: company.logoUrl ?? null,
        logoAlt: company.logoAlt ?? null,
        website: company.website ?? null,
        city: company.city ?? null,
      },
      services: specialist.services,
    })),
  }));
}

export async function fetchCompany(slug: string): Promise<Company | null> {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      specialists: {
        include: {
          services: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
        },
      },
      posts: {
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          coverImageAlt: true,
          publishedAt: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      },
    },
  });

  if (!company) return null;

  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
    description: company.description ?? null,
    shortDesc: company.shortDesc ?? null,
    longDesc: company.longDesc ?? null,
    logoUrl: company.logoUrl ?? null,
    logoAlt: company.logoAlt ?? null,
    website: company.website ?? null,
    phone: company.phone ?? null,
    email: company.email ?? null,
    address: company.address ?? null,
    city: company.city ?? null,
    mapLink: company.mapLink ?? null,
    posts: company.posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      coverImageAlt: (post as any).coverImageAlt ?? null,
      publishedAt: post.publishedAt,
    })),
    specialists: company.specialists.map((specialist) => ({
      id: specialist.id,
      slug: specialist.slug,
      name: specialist.name,
      role: specialist.role ?? null,
      bio: specialist.bio ?? null,
      avatarUrl: specialist.avatarUrl ?? null,
      languages: JSON.parse(specialist.languages || "[]"),
      specializations: JSON.parse(specialist.specializations || "[]"),
      contactEmail: specialist.contactEmail ?? null,
      contactPhone: specialist.contactPhone ?? null,
      city: specialist.city ?? null,
      companyId: specialist.companyId ?? null,
      company: {
        id: company.id,
        slug: company.slug,
        name: company.name,
        logoUrl: company.logoUrl ?? null,
        logoAlt: company.logoAlt ?? null,
        website: company.website ?? null,
        city: company.city ?? null,
      },
      services: specialist.services,
    })),
  };
}
