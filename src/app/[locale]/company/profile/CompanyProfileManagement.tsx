'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Globe, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image'

interface CompanyProfileManagementProps {
  locale: string;
}

interface CompanyProfile {
  name: string;
  description: string | null;
  shortDesc: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  mapLink: string | null;
  logoUrl: string | null;
  logoAlt: string | null;
}

export default function CompanyProfileManagement({ locale }: CompanyProfileManagementProps) {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCompany() {
      setLoading(true);
      try {
        const res = await fetch('/api/company/profile', { credentials: 'include' });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || res.statusText);
        }
        const payload = await res.json();
        if (active) {
          setCompany(payload);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load company profile');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCompany();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {locale === 'ka' ? 'პროფილის შეჯამება' : locale === 'ru' ? 'Сводка профиля' : 'Profile Summary'}
        </CardTitle>
        <CardDescription>
          {locale === 'ka'
            ? 'თქვენი კომპანიის საჯარო პრეზენტაციის სწრაფი შეხსენება'
            : locale === 'ru'
            ? 'Краткое представление публичного профиля компании'
            : 'At-a-glance information from your public company profile'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            {locale === 'ka' ? 'იტვირთება...' : locale === 'ru' ? 'Загрузка...' : 'Loading...'}
          </p>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : company ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <Image
                    src={company.logoUrl}
                    alt={company.logoAlt || 'Company logo'}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    priority={false}
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold leading-tight">{company.name}</h3>
                {company.shortDesc && (
                  <p className="text-xs text-muted-foreground">{company.shortDesc}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{company.city || company.address || (locale === 'ka' ? 'მისამართი მიუთითეთ' : locale === 'ru' ? 'Укажите адрес' : 'Add address')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{company.email || (locale === 'ka' ? 'ელფოსტა მიუთითეთ' : locale === 'ru' ? 'Укажите email' : 'Provide email')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{company.phone || (locale === 'ka' ? 'ტელეფონი მიუთითეთ' : locale === 'ru' ? 'Укажите телефон' : 'Add phone')}</span>
              </div>
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            {company.description && (
              <div className="rounded border bg-muted/30 px-3 py-3 text-sm">
                {company.description}
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
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {locale === 'ka' ? 'კომპანიის მონაცემი ვერ მოიძებნა' : locale === 'ru' ? 'Данные компании не найдены' : 'Company profile not found'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

