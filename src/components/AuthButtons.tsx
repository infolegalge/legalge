"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function AuthButtons() {
  const { status, data: session } = useSession();
  type SessionUserWithRole = { role?: 'SUBSCRIBER' | 'SPECIALIST' | 'COMPANY' | 'SUPER_ADMIN'; name?: string | null; email?: string | null };
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");
  const locale = useLocale();
  
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  
  return (
    <div className="ml-2 flex items-center gap-2">
      {status !== "authenticated" ? (
        <>
          <button
            className="rounded border px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => router.push(`/${locale}/auth/signin`)}
          >
            {t("sign_in")}
          </button>
          <button
            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => router.push(`/${locale}/auth/register`)}
          >
            {t("sign_up")}
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          {/* Only show profile name button for SUBSCRIBER users, SUPER_ADMIN already has CMS button */}
          {(session?.user as SessionUserWithRole | undefined)?.role === 'SUBSCRIBER' && (
            <button
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              onClick={() => router.push(`/${locale}/subscriber`)}
            >
              {(session?.user as SessionUserWithRole | undefined)?.name || (session?.user as SessionUserWithRole | undefined)?.email}
            </button>
          )}
          {(session?.user as SessionUserWithRole | undefined)?.role === 'SPECIALIST' && (
            <button
              className="rounded bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
              onClick={() => router.push(`/${locale}/specialist`)}
            >
              {(session?.user as SessionUserWithRole | undefined)?.name || (session?.user as SessionUserWithRole | undefined)?.email}
            </button>
          )}
          {(session?.user as SessionUserWithRole | undefined)?.role === 'COMPANY' && (
            <button
              className="rounded bg-orange-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              onClick={() => router.push(`/${locale}/company`)}
            >
              {(session?.user as SessionUserWithRole | undefined)?.name || (session?.user as SessionUserWithRole | undefined)?.email}
            </button>
          )}
          {/* Show just the name for SUPER_ADMIN (no button since they have CMS) */}
          {(session?.user as SessionUserWithRole | undefined)?.role === 'SUPER_ADMIN' && (
            <span className="text-sm text-foreground/80">
              {(session?.user as SessionUserWithRole | undefined)?.name || (session?.user as SessionUserWithRole | undefined)?.email}
            </span>
          )}
          <button
            className="rounded border px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={() => signOut()}
          >
            {t("sign_out")}
          </button>
        </div>
      )}
    </div>
  );
}


