import { SITE_ORIGIN } from "@/lib/metadata";

interface ServiceLdParams {
  name: string;
  description?: string | null;
  url: string;
  areaServed?: string;
}

interface ArticleLdParams {
  title: string;
  description?: string | null;
  url: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  locale: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildOrganizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Legal Sandbox Georgia",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/logo-light.png`,
    sameAs: [
      "https://www.linkedin.com/company/legal-sandbox-georgia/",
    ],
  } as const;
}

export function buildServiceLd({
  name,
  description,
  url,
  areaServed = "Georgia",
}: ServiceLdParams) {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name,
    description: description || undefined,
    url,
    areaServed,
    provider: {
      "@type": "Organization",
      name: "Legal Sandbox Georgia",
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/logo-light.png`,
    },
  } as const;
}

export function buildArticleLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
  locale,
}: ArticleLdParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: title.slice(0, 110),
    description: description || undefined,
    url,
    image: image ? [image] : undefined,
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    inLanguage: locale,
    author: authorName
      ? {
          "@type": "Person",
          name: authorName,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Legal Sandbox Georgia",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_ORIGIN}/logo-light.png`,
      },
    },
  } as const;
}

export function buildBreadcrumbLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  } as const;
}

