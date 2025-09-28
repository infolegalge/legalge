import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/locales";

type Service = { slug: string; title: string; description: string };

export default function ServicesGrid({
  locale,
  services = [],
}: {
  locale: Locale;
  services?: Service[];
}) {
  const t = useTranslations();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.length === 0 ? (
          <p className="text-foreground/70">{t("nav.practice")}</p>
        ) : (
          services.map((s) => (
            <Link
              key={s.slug}
              href={`/${locale}/practice/${s.slug}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <h3 className="font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-foreground/70">{s.description}</p>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}


