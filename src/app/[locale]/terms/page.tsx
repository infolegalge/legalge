import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import prisma from "@/lib/prisma";
import { createLocaleRouteMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const termsContent = await getTermsContent(locale);
  return createLocaleRouteMetadata(locale, "terms", {
    title: termsContent.metaTitle || "Terms of Service",
    description: termsContent.metaDescription || "Terms of Service for Legal Sandbox Georgia",
  });
}

async function getTermsContent(locale: Locale) {
  try {
    // First try to get the translation for the current locale
    const translation = await prisma.legalPageTranslation.findFirst({
      where: {
        slug: 'terms',
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
      where: { slug: 'terms' }
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
      title: "Terms of Service",
      content: "Terms of Service content not available.",
      metaTitle: null,
      metaDescription: null
    };
  } catch (error) {
    console.error('Error fetching terms content:', error);
    return {
      title: "Terms of Service",
      content: "Terms of Service content not available.",
      metaTitle: null,
      metaDescription: null
    };
  }
}

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const termsContent = await getTermsContent(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold mb-8">{termsContent.title}</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: termsContent.content.replace(/\n/g, '<br/>') }} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";