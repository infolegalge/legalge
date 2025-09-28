import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import type { Locale } from '@/i18n/locales'
import prisma from '@/lib/prisma'
import CompanyOverview from './CompanyOverview'

export default async function CompanyDashboard({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return (
      <div className="p-6">Unauthorized</div>
    )
  }

  const company = await prisma.company.findFirst({
    where: { slug: (session.user as any).companySlug ?? undefined },
    select: { id: true, slug: true, name: true, city: true },
  })

  return (
    <CompanyOverview locale={locale} company={company} />
  )
}

export const dynamic = "force-dynamic";




