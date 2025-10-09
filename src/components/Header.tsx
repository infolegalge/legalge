"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import LocaleSwitcher from "./LocaleSwitcher";
import ThemeToggle from "./ThemeToggle";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
const AuthButtons = dynamic(() => import("./AuthButtons"), { ssr: false });

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const base = `/${locale}`;
  const navItems: Array<{ href: string; label: string }> = [
    { href: `${base}/practice`, label: t("nav.practice") },
    { href: `${base}/specialists`, label: t("nav.specialists") },
    { href: `${base}/news`, label: t("nav.news") },
    { href: `${base}/contact`, label: t("nav.contact") },
  ];

  const activeDesktopIndex = navItems.findIndex((item) => pathname?.startsWith(item.href));
  const [rovingIndex, setRovingIndex] = useState(() => (activeDesktopIndex >= 0 ? activeDesktopIndex : 0));
  const navRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useEffect(() => {
    const match = navItems.findIndex((item) => pathname?.startsWith(item.href));
    setRovingIndex(match >= 0 ? match : 0);
  }, [pathname, navItems.length]);

  useEffect(() => {
    const current = navRefs.current[rovingIndex];
    if (current && document.activeElement && !navRefs.current.includes(document.activeElement as HTMLAnchorElement)) {
      current.tabIndex = 0;
    }
  }, [rovingIndex]);

  const moveFocus = useCallback(
    (nextIndex: number) => {
      const total = navItems.length;
      const normalized = ((nextIndex % total) + total) % total;
      setRovingIndex(normalized);
      const target = navRefs.current[normalized];
      if (target) {
        target.focus();
      }
    },
    [navItems.length],
  );

  const handleRovingKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          moveFocus(index + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          moveFocus(index - 1);
          break;
        case "Home":
          event.preventDefault();
          moveFocus(0);
          break;
        case "End":
          event.preventDefault();
          moveFocus(navItems.length - 1);
          break;
        default:
          break;
      }
    },
    [moveFocus, navItems.length],
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={base} className="flex items-center gap-2" aria-label={t("site.title") + " Home"}>
          <Image
            src="/logo-light.png"
            alt={t("site.title")}
            width={140}
            height={28}
            className="hidden dark:block h-7 w-auto"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt={t("site.title")}
            width={140}
            height={28}
            className="block dark:hidden h-7 w-auto"
            priority
          />
        </Link>
        <nav role="navigation" aria-label="Main" className="hidden items-center md:flex">
          <ul className="flex items-center gap-2">
            {navItems.map((item, idx) => (
              <li key={item.href} className="flex items-center">
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors",
                    pathname?.startsWith(item.href)
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  )}
                  aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
                  tabIndex={rovingIndex === idx ? 0 : -1}
                  ref={(el) => {
                    navRefs.current[idx] = el;
                  }}
                  onFocus={() => setRovingIndex(idx)}
                  onKeyDown={(event) => handleRovingKeyDown(event, idx)}
                >
                  {item.label}
                </Link>
                {idx < navItems.length - 1 ? (
                  <span className="mx-2 hidden h-4 w-px bg-border md:inline-block" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ul>
          {status === "authenticated" && (session?.user as any)?.role === "SUPER_ADMIN" ? (
            <>
              <span className="mx-2 hidden h-4 w-px bg-border md:inline-block" aria-hidden="true" />
              <Link
                href={`${base}/admin`}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors inline-flex items-center gap-1.5",
                  pathname?.startsWith(`${base}/admin`)
                    ? "bg-primary/10 text-foreground"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground",
                )}
                aria-current={pathname?.startsWith(`${base}/admin`) ? "page" : undefined}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                {t("header.cms")}
              </Link>
            </>
          ) : null}
          <LocaleSwitcher />
          <ThemeToggle />
          <AuthButtons />
        </nav>
        
        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav role="navigation" aria-label="Mobile main" className="px-4 py-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      pathname?.startsWith(item.href)
                        ? "bg-primary/10 text-foreground"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {status === "authenticated" && (session?.user as any)?.role === "SUPER_ADMIN" && (
                <li>
                  <Link
                    href={`${base}/admin`}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors flex items-center gap-2",
                      pathname?.startsWith(`${base}/admin`)
                        ? "bg-primary/10 text-foreground"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={pathname?.startsWith(`${base}/admin`) ? "page" : undefined}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t("header.cms")}
                  </Link>
                </li>
              )}
              <li className="pt-2 border-t">
                <div className="flex items-center justify-between px-3 py-2">
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
              </li>
              <li className="pt-2">
                <AuthButtons />
              </li>
            </ul>
          </nav>
        </div>
      )}
      
    </header>
  );
}


