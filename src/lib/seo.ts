export function organizationJsonLd({
  name,
  url,
  logo,
}: {
  name: string;
  url: string;
  logo?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    ...(logo ? { logo } : {}),
  } as const;
}

export function legalServiceJsonLd({
  name,
  url,
  description,
}: {
  name: string;
  url: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name,
    url,
    ...(description ? { description } : {}),
  } as const;
}

export function articleJsonLd({
  headline,
  url,
  datePublished,
}: {
  headline: string;
  url: string;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    url,
    ...(datePublished ? { datePublished } : {}),
  } as const;
}


