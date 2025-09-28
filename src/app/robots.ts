export default function robots() {
  const host = process.env.NEXT_PUBLIC_SITE_URL ?? "https://legal.ge";
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/*/admin", "/api/auth/"] },
    ],
    sitemap: `${host}/sitemap.xml`,
  } as const;
}


