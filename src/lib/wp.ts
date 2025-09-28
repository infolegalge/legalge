import { z } from "zod";

const env = {
  WP_BASE_URL: process.env.NEXT_PUBLIC_WP_BASE_URL ?? "https://infolegalge-fcztd.wpcomstaging.com",
};

// Schemas
export const ImageSchema = z.object({
  src: z.string().url(),
  alt: z.string().default(""),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const PracticeAreaSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().optional(),
  content: z.string(),
  hero_image: ImageSchema.nullable().optional(),
  cta: z.string().optional(),
});
export type PracticeArea = z.infer<typeof PracticeAreaSchema>;

export const LawyerSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
  role: z.string().optional(),
  bio: z.string().optional(),
  avatar: ImageSchema.nullable().optional(),
  practiceAreas: z.array(z.string()).default([]),
  contacts: z.record(z.string(), z.string()).default({}),
  socials: z.record(z.string(), z.string()).default({}),
});
export type Lawyer = z.infer<typeof LawyerSchema>;

export const PostSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  author: z.string().optional(),
  cover_image: ImageSchema.nullable().optional(),
  tags: z.array(z.string()).default([]),
  date: z.string().optional(),
});
export type Post = z.infer<typeof PostSchema>;

// Utilities
async function wpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = new URL(path.replace(/^\//, ""), env.WP_BASE_URL);
  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`WP fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// Minimal WP REST types for fields we use
type WPRendered = { rendered?: string };

interface WPFeaturedMedia {
  source_url: string;
  alt_text?: string;
  media_details?: { width?: number; height?: number };
}

interface WPEmbedded {
  [key: string]: unknown;
  "wp:featuredmedia"?: WPFeaturedMedia[];
  author?: { name?: string }[];
}

interface WPPracticeAreaItem {
  id: number;
  slug: string;
  title?: WPRendered;
  excerpt?: WPRendered;
  content?: WPRendered;
  meta?: { cta?: string } & Record<string, unknown>;
  _embedded?: WPEmbedded;
}

interface WPLawyerItem {
  id: number;
  slug: string;
  title?: WPRendered;
  content?: WPRendered;
  meta?: {
    role?: string;
    practice_areas?: string[];
    contacts?: Record<string, string>;
    socials?: Record<string, string>;
  } & Record<string, unknown>;
  _embedded?: WPEmbedded;
}

interface WPPostItem {
  id: number;
  slug: string;
  title?: WPRendered;
  content?: WPRendered;
  tags?: number[];
  date?: string;
  _embedded?: WPEmbedded;
}

// REST mappers (adjust based on actual WP schema)
const mapImageFromWp = (media?: WPFeaturedMedia | undefined) =>
  media
    ? {
        src: media.source_url as string,
        alt: (media.alt_text as string) ?? "",
        width: Number(media.media_details?.width) || undefined,
        height: Number(media.media_details?.height) || undefined,
      }
    : null;

export async function fetchPracticeAreas(): Promise<PracticeArea[]> {
  // Example endpoint: /wp-json/wp/v2/practice_area
  const items = await wpFetch<WPPracticeAreaItem[]>(
    "/wp-json/wp/v2/practice_area?per_page=100&_embed",
  );
  return items.map((i) =>
    PracticeAreaSchema.parse({
      id: i.id,
      slug: i.slug,
      title: i.title?.rendered ?? "",
      excerpt: i.excerpt?.rendered ?? "",
      content: i.content?.rendered ?? "",
      hero_image: mapImageFromWp(i._embedded?.["wp:featuredmedia"]?.[0] ?? undefined),
      cta: i.meta?.cta ?? undefined,
    }),
  );
}

export async function fetchPracticeArea(slug: string): Promise<PracticeArea | null> {
  const items = await wpFetch<WPPracticeAreaItem[]>(
    `/wp-json/wp/v2/practice_area?slug=${encodeURIComponent(slug)}&_embed`,
  );
  if (!items.length) return null;
  const i = items[0];
  return PracticeAreaSchema.parse({
    id: i.id,
    slug: i.slug,
    title: i.title?.rendered ?? "",
    excerpt: i.excerpt?.rendered ?? "",
    content: i.content?.rendered ?? "",
    hero_image: mapImageFromWp(i._embedded?.["wp:featuredmedia"]?.[0] ?? undefined),
    cta: i.meta?.cta ?? undefined,
  });
}

export async function fetchLawyers(): Promise<Lawyer[]> {
  const items = await wpFetch<WPLawyerItem[]>("/wp-json/wp/v2/lawyer?per_page=100&_embed");
  return items.map((i) =>
    LawyerSchema.parse({
      id: i.id,
      slug: i.slug,
      name: i.title?.rendered ?? "",
      role: i.meta?.role ?? undefined,
      bio: i.content?.rendered ?? "",
      avatar: mapImageFromWp(i._embedded?.["wp:featuredmedia"]?.[0] ?? undefined),
      practiceAreas: Array.isArray(i.meta?.practice_areas) ? i.meta.practice_areas : [],
      contacts: i.meta?.contacts ?? {},
      socials: i.meta?.socials ?? {},
    }),
  );
}

export async function fetchLawyer(slug: string): Promise<Lawyer | null> {
  const items = await wpFetch<WPLawyerItem[]>(
    `/wp-json/wp/v2/lawyer?slug=${encodeURIComponent(slug)}&_embed`,
  );
  if (!items.length) return null;
  const i = items[0];
  return LawyerSchema.parse({
    id: i.id,
    slug: i.slug,
    name: i.title?.rendered ?? "",
    role: i.meta?.role ?? undefined,
    bio: i.content?.rendered ?? "",
    avatar: mapImageFromWp(i._embedded?.["wp:featuredmedia"]?.[0] ?? undefined),
    practiceAreas: Array.isArray(i.meta?.practice_areas) ? i.meta.practice_areas : [],
    contacts: i.meta?.contacts ?? {},
    socials: i.meta?.socials ?? {},
  });
}

export async function fetchPosts(): Promise<Post[]> {
  const items = await wpFetch<WPPostItem[]>("/wp-json/wp/v2/posts?per_page=100&_embed");
  return items.map((i) =>
    PostSchema.parse({
      id: i.id,
      slug: i.slug,
      title: i.title?.rendered ?? "",
      content: i.content?.rendered ?? "",
      author: i._embedded?.author?.[0]?.name ?? undefined,
      cover_image: mapImageFromWp(i._embedded?.["wp:featuredmedia"]?.[0] ?? undefined),
      tags: Array.isArray(i.tags) ? i.tags.map(String) : [],
      date: i.date,
    }),
  );
}

export async function fetchPost(slug: string): Promise<Post | null> {
  const items = await wpFetch<WPPostItem[]>(
    `/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`,
  );
  if (!items.length) return null;
  const i = items[0];
  return PostSchema.parse({
    id: i.id,
    slug: i.slug,
    title: i.title?.rendered ?? "",
    content: i.content?.rendered ?? "",
    author: i._embedded?.author?.[0]?.name ?? undefined,
    cover_image: mapImageFromWp(i._embedded?.["wp:featuredmedia"]?.[0] ?? undefined),
    tags: Array.isArray(i.tags) ? i.tags.map(String) : [],
    date: i.date,
  });
}


