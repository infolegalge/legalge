import Image from "next/image";
import Link from "next/link";
import type { SpecialistProfile } from "@/lib/specialists";
import type { Locale } from "@/i18n/locales";
import { Building2, User, Mail, Phone } from "lucide-react";

interface SpecialistCardProps {
  specialist: SpecialistProfile;
  locale: Locale;
  showCompany?: boolean;
}

export default function SpecialistCard({ specialist, locale, showCompany = true }: SpecialistCardProps) {
  const href = `/${locale}/specialists/${specialist.slug}`;
  
  return (
    <Link href={href} className="group block">
      <div className="rounded-lg border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20">
        {/* Header with avatar and basic info */}
        <div className="flex items-start gap-4">
          {specialist.avatarUrl ? (
            <Image
              src={specialist.avatarUrl}
              alt={specialist.name}
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {specialist.name}
            </h3>
            {specialist.role && (
              <p className="text-sm text-muted-foreground mt-1">{specialist.role}</p>
            )}
            
            {/* Company or Solo Badge */}
            {showCompany && (
              <div className="mt-2">
                {specialist.company ? (
                  <div className="flex items-center gap-2">
                    {specialist.company.logoUrl ? (
                      <Image
                        src={specialist.company.logoUrl}
                        alt={specialist.company.name}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded object-cover"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {specialist.company.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Solo Practitioner
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Specializations */}
        {specialist.specializations.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1">
              {specialist.specializations.slice(0, 3).map((spec, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {spec}
                </span>
              ))}
              {specialist.specializations.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  +{specialist.specializations.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Languages */}
        {specialist.languages.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">
              Languages: {specialist.languages.join(", ")}
            </p>
          </div>
        )}

        {/* Contact info */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          {specialist.contactEmail && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{specialist.contactEmail}</span>
            </div>
          )}
          {specialist.contactPhone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{specialist.contactPhone}</span>
            </div>
          )}
        </div>

        {/* Bio preview */}
        {specialist.bio && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {specialist.bio}
          </p>
        )}
      </div>
    </Link>
  );
}
