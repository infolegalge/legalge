import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { redirect } from 'next/navigation'
import type { Locale } from '@/i18n/locales'
import { fetchCompanies } from '@/lib/specialists'
import RequestForm from '@/app/[locale]/request/RequestForm'

export default async function SubscriberDashboard({ params }: { params: Promise<{ locale: Locale }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    redirect('/auth/signin')
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'SUBSCRIBER') {
    redirect('/')
  }

  const { locale } = await params

  let companies: Awaited<ReturnType<typeof fetchCompanies>> = []
  try {
    companies = await fetchCompanies()
  } catch {
    companies = []
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscriber Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome! As a subscriber, you can request to become a Specialist or a Company.
          </p>
        </div>

        <RequestForm companies={companies} locale={locale} />
      </div>
    </div>
  )
}