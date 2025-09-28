"use client";

import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";

type Item = { id: number | string; title: string; href: string };

export default function Search({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const fuse = useMemo(() => new Fuse(items, { keys: ["title"], threshold: 0.35 }), [items]);
  const [results, setResults] = useState<Item[]>(items);
  useEffect(() => {
    if (!query) setResults(items);
    else setResults(fuse.search(query).map((r) => r.item));
  }, [query, items, fuse]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <input
        placeholder="Search"
        className="mb-3 w-full rounded border px-3 py-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search"
      />
      <ul className="space-y-2">
        {results.map((r) => (
          <li key={r.id} className="text-sm">
            <a className="hover:underline" href={r.href}>
              {r.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}


