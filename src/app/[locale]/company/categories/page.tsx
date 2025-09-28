import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import type { Locale } from '@/i18n/locales';
import CompanyCategoriesPage from './CompanyCategoriesPage';
import prisma from '@/lib/prisma';

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !['COMPANY', 'SUPER_ADMIN'].includes((session.user as any)?.role)) {
    redirect('/');
  }

  const { locale } = await params;
  let companyName: string | null = null;

  if ((session.user as any)?.companyId) {
    companyName = await prisma.company.findUnique({
      where: { id: (session.user as any).companyId },
      select: { name: true },
    }).then((res) => res?.name ?? null);
  }

  return <CompanyCategoriesPage locale={locale} companyName={companyName ?? undefined} />;
}

export const dynamic = 'force-dynamic';


