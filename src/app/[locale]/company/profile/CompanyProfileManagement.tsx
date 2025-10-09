'use client';

import { Building2, ExternalLink, Globe, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import type { ProfileCompany } from './page';

interface CompanyProfileManagementProps {
  locale: string;
  company: ProfileCompany;
}

const SOCIAL_HINTS: Array<[label: string, key: keyof ProfileCompany]> = [
  ['Facebook', 'socialLinks'],
];

export default function CompanyProfileManagement({ locale, company }: CompanyProfileManagementProps) {
  const socialLinks = (() => {
    if (!company.socialLinks) return [] as Array<{ label: string; url: string }>;
    try {
      const parsed = JSON.parse(company.socialLinks);
      if (Array.isArray(parsed)) {
        return parsed.filter((entry) => entry?.url).map((entry) => ({
          label: entry.label || entry.url,
          url: entry.url,
        }));
      }
    } catch (error) {
      console.warn('Invalid social links JSON', error);
    }
    return [] as Array<{ label: string; url: string }>;
  })();

  const summaryLabel = locale === 'ka' ? 'საჯარო ინფორმაცია' : locale === 'ru' ? 'Публичная информация' : 'Public Profile';

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded bg-muted flex items-center justify-center overflow-hidden">
            {company.logoUrl ? (
              <Image
                src={company.logoUrl}
                alt={company.logoAlt || company.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-tight">{company.name}</h2>
            {company.shortDesc && <p className="text-sm text-muted-foreground">{company.shortDesc}</p>}
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <h3 className="text-sm font-medium text-foreground">{summaryLabel}</h3>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{company.phone || (locale === 'ka' ? 'სერვისი მართავს მხარდაჭერა' : locale === 'ru' ? 'Контактом управляет поддержка' : 'Managed by support')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>{company.email || (locale === 'ka' ? 'ელფოსტა მიუთითეთ' : locale === 'ru' ? 'Укажите email' : 'Email not set')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {company.website ? (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <span>{locale === 'ka' ? 'ვებგვერდი არაა მითითებული' : locale === 'ru' ? 'Сайт не указан' : 'Website not set'}</span>
            )}
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5" />
            <span>{company.address || (locale === 'ka' ? 'მისამართი მიუთითეთ' : locale === 'ru' ? 'Укажите адрес' : 'Address not set')}</span>
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Social</h3>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-muted"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {(company.description || company.mission || company.vision || company.history || company.contactPrompt) && (
          <div className="space-y-3 text-sm">
            {company.description && (
              <p className="whitespace-pre-line text-foreground/80">{company.description}</p>
            )}
            {company.mission && (
              <div>
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Mission</h4>
                <p className="whitespace-pre-line text-foreground/80">{company.mission}</p>
              </div>
            )}
            {company.vision && (
              <div>
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Vision</h4>
                <p className="whitespace-pre-line text-foreground/80">{company.vision}</p>
              </div>
            )}
            {company.history && (
              <div>
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground">History</h4>
                <p className="whitespace-pre-line text-foreground/80">{company.history}</p>
              </div>
            )}
            {company.contactPrompt && (
              <div>
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Client Prompt</h4>
                <p className="whitespace-pre-line text-foreground/80">{company.contactPrompt}</p>
              </div>
            )}
          </div>
        )}

        {company.mapLink && (
          <a
            href={company.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {locale === 'ka' ? 'გახსენი რუკა' : locale === 'ru' ? 'Открыть карту' : 'Open map'}
          </a>
        )}

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            {locale === 'ka'
              ? 'სოციალური ბმულები: ჩასვით სრული URL Facebook, Instagram, LinkedIn ან X-ზე.'
              : locale === 'ru'
              ? 'Социальные ссылки: вставляйте полный URL для Facebook, Instagram, LinkedIn или X.'
              : 'Social links: paste full URLs for Facebook, Instagram, LinkedIn, or X.'}
          </p>
        </div>
      </div>
    </div>
  );
}

