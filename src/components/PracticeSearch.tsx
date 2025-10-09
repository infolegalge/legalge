"use client";
import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import Link from "next/link";

type Practice = { id: string; slug: string; title: string; services?: string[]; servicesCount?: number; searchTitles?: string[] };
type Service = { id: string; slug: string; title: string; parentId: string; searchTitles?: string[] };

type Props = {
  locale: string;
  practices: Practice[];
  services: Service[];
  inputLabel?: string;
  headingLabels?: {
    practices?: string;
    services?: string;
    noMatches?: string;
    practiceTag?: string;
    serviceTag?: string;
    servicesCount?: string;
    parentPractice?: string;
  };
};

export default function PracticeSearch({ locale, practices, services, inputLabel, headingLabels }: Props) {
  const [query, setQuery] = useState("");

  const practiceFuse = useMemo(
    () =>
      new Fuse(practices, {
        keys: ["title", "searchTitles"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [practices],
  );
  const serviceFuse = useMemo(
    () =>
      new Fuse(services, {
        keys: ["title", "searchTitles"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [services],
  );

  const practiceResults = useMemo(() => {
    if (!query.trim()) return practices.slice(0, 12);
    return practiceFuse.search(query).map((r) => r.item).slice(0, 12);
  }, [practiceFuse, practices, query]);

  const serviceResults = useMemo(() => {
    if (!query.trim()) return [] as Service[];
    return serviceFuse.search(query).map((r) => r.item).slice(0, 10);
  }, [serviceFuse, query]);

  const parentTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of practices) map[p.id] = p.title;
    return map;
  }, [practices]);

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border bg-background/80 px-4 py-3 text-sm shadow-sm outline-none backdrop-blur focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder={inputLabel ?? "Search practice areas or services"}
          aria-label={inputLabel ?? "Search practice areas or services"}
        />
        <div className="pointer-events-none absolute inset-y-0 right-3 hidden items-center gap-2 sm:flex">
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground/70">⌘</kbd>
          <span className="text-[10px] text-foreground/60">K</span>
        </div>
      </div>

      {query.trim() ? (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium">{headingLabels?.practices ?? "Practice areas"}</h3>
            {practiceResults.length === 0 ? (
              <p className="mt-2 text-sm text-foreground/60">{headingLabels?.noMatches ?? "No matches"}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {practiceResults.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/${locale}/practice/${p.slug}`}
                      className="block rounded-md border px-3 py-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs">{headingLabels?.practiceTag ?? "Practice"}</span>
                        <span className="font-medium">{p.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-foreground/60">
                        {headingLabels?.servicesCount
                          ? headingLabels.servicesCount.replace("{count}", `${p.servicesCount ?? p.services?.length ?? 0}`)
                          : `${p.servicesCount ?? p.services?.length ?? 0} services`}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium">{headingLabels?.services ?? "Services"}</h3>
            {serviceResults.length === 0 ? (
              <p className="mt-2 text-sm text-foreground/60">{headingLabels?.noMatches ?? "No matches"}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {serviceResults.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/${locale}/services/${s.slug}`}
                      className="block rounded-md border px-3 py-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs">{headingLabels?.serviceTag ?? "Service"}</span>
                        <span className="font-medium">{s.title}</span>
                      </div>
                      <div className="mt-1 text-xs text-foreground/60">
                        {headingLabels?.parentPractice
                          ? headingLabels.parentPractice.replace("{practice}", parentTitleById[s.parentId] ?? "")
                          : parentTitleById[s.parentId]}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}


