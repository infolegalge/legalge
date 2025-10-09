'use client';

import { Building2 } from 'lucide-react';
import Image from 'next/image';

interface CompanyProfileManagementProps {
  name: string;
  slug: string;
  shortDesc: string | null;
  logoUrl: string | null;
  logoAlt: string | null;
}

export default function CompanyProfileManagement({ name, shortDesc, logoUrl, logoAlt }: CompanyProfileManagementProps) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded bg-muted flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={logoAlt || name}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-tight">{name}</h2>
          {shortDesc && <p className="text-sm text-muted-foreground">{shortDesc}</p>}
        </div>
      </div>
    </div>
  );
}

