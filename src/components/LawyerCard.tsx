import Image from "next/image";
import Link from "next/link";
import type { Lawyer } from "@/lib/wp";
import type { Locale } from "@/i18n/locales";

export default function LawyerCard({ lawyer, locale }: { lawyer: Lawyer; locale: Locale }) {
  const href = `/${locale}/lawyers/${lawyer.slug}`;
  return (
    <Link href={href} className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted">
      {lawyer.avatar?.src ? (
        <Image
          src={lawyer.avatar.src}
          alt={lawyer.avatar.alt}
          width={64}
          height={64}
          className="h-16 w-16 rounded-full object-cover"
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-muted" aria-hidden />
      )}
      <div>
        <div className="font-medium">{lawyer.name}</div>
        {lawyer.role ? <div className="text-sm text-foreground/70">{lawyer.role}</div> : null}
      </div>
    </Link>
  );
}


