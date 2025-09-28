"use client";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const base = `/${locale}`;
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-foreground/70 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Legal Sandbox Georgia. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href={`${base}/privacy`} className="hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link href={`${base}/terms`} className="hover:text-foreground">
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


