import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import prisma from "@/lib/prisma";
import { createLocaleRouteMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const privacyContent = await getPrivacyContent(locale);
  return createLocaleRouteMetadata(locale, "privacy", {
    title: (privacyContent.metaTitle || "Privacy Policy").slice(0, 60),
    description:
      privacyContent.metaDescription?.slice(0, 160) ||
      "Understand how Legal Sandbox Georgia collects, stores, and protects your personal data.",
  });
}

async function getPrivacyContent(locale: Locale) {
  try {
    // First try to get the translation for the current locale
    const translation = await prisma.legalPageTranslation.findFirst({
      where: {
        slug: 'privacy',
        locale: locale
      }
    });

    if (translation) {
      return {
        title: translation.title,
        content: translation.content,
        metaTitle: translation.metaTitle,
        metaDescription: translation.metaDescription
      };
    }

    // Fallback to base page
    const basePage = await prisma.legalPage.findUnique({
      where: { slug: 'privacy' }
    });

    if (basePage) {
      return {
        title: basePage.title,
        content: basePage.content,
        metaTitle: null,
        metaDescription: null
      };
    }

    // Ultimate fallback
    return {
      title: "Privacy Policy",
      content: "Privacy Policy content not available.",
      metaTitle: null,
      metaDescription: null
    };
  } catch (error) {
    console.error('Error fetching privacy content:', error);
    return {
      title: "Privacy Policy",
      content: "Privacy Policy content not available.",
      metaTitle: null,
      metaDescription: null
    };
  }
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const privacyContent = await getPrivacyContent(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold mb-8">{privacyContent.title}</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: privacyContent.content.replace(/\n/g, '<br/>') }} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";