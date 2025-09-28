import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import type { Locale } from '@/i18n/locales';
import CompanyAnalytics from './CompanyAnalytics';

export default async function CompanyAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || !session.user || !['COMPANY', 'SUPER_ADMIN'].includes(role)) {
    redirect('/');
  }

  const { locale } = await params;
  return <CompanyAnalytics locale={locale} />;
}

export const dynamic = 'force-dynamic';

