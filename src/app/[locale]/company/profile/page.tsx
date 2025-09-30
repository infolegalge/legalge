import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import type { Locale } from '@/i18n/locales'
import prisma from '@/lib/prisma'
import CompanyEditForm from '@/components/admin/CompanyEditForm'
import CompanyProfileManagement from './CompanyProfileManagement'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

interface ProfileCompany {
  id: string
  slug: string
  name: string
  city: string | null
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const session = await getServerSession(authOptions)

  const { locale } = await params

  const role = (session?.user as { role?: string })?.role
  if (!session || role !== 'COMPANY') {
    redirect(`/${locale}`)
  }

  // Resolve company by id first, then fall back to slug if id is missing
  let company: ProfileCompany | null = null
  let userCompanyId = (session.user as { companyId?: string | null })?.companyId || undefined
  if (userCompanyId) {
    company = await prisma.company.findUnique({ where: { id: userCompanyId }, select: { id: true, slug: true, name: true, city: true } })
  }
  if (!company) {
    // Try to load user record to get company linkage
    const dbUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { companyId: true, companySlug: true },
    })
    if (dbUser?.companyId) {
      userCompanyId = dbUser.companyId
      company = await prisma.company.findUnique({ where: { id: dbUser.companyId }, select: { id: true, slug: true, name: true, city: true } })
    } else if (dbUser?.companySlug) {
      company = await prisma.company.findUnique({ where: { slug: dbUser.companySlug }, select: { id: true, slug: true, name: true, city: true } })
    }
  }
  if (!company) {
    // If still not found, route back to company dashboard instead of site home
    redirect(`/${locale}/company`)
  }

  const resolvedCompany = company as ProfileCompany

  // Load translations for editor
  let translations: Array<{ locale: 'ka'|'en'|'ru'; name: string; slug: string; description: string | null; shortDesc: string | null; longDesc: string | null }> = []
  try {
    const client: any = prisma as any
    if (client.companyTranslation && typeof client.companyTranslation.findMany === 'function') {
      translations = await client.companyTranslation.findMany({
        where: { companyId: resolvedCompany.id },
        select: { locale: true, name: true, slug: true, description: true, shortDesc: true, longDesc: true },
      })
    }
  } catch {}

  async function updateCompany(formData: FormData) {
    'use server'
    const innerSession = await getServerSession(authOptions)
    const innerRole = (innerSession?.user as { role?: string })?.role
    if (!innerSession || innerRole !== 'COMPANY') {
      return { error: 'Forbidden' }
    }
    const name = String(formData.get('name') || '').trim()
    const name_en = String(formData.get('name_en') || '').trim()
    const name_ru = String(formData.get('name_ru') || '').trim()
    if (!name) {
      return { error: 'Name is required' }
    }
    const description = String(formData.get('description') || '').trim() || null
    const description_en = String(formData.get('description_en') || '').trim() || null
    const description_ru = String(formData.get('description_ru') || '').trim() || null
    const shortDesc = String(formData.get('shortDesc') || '').trim() || null
    const shortDesc_en = String(formData.get('shortDesc_en') || '').trim() || null
    const shortDesc_ru = String(formData.get('shortDesc_ru') || '').trim() || null
    const longDesc = String(formData.get('longDesc') || '').trim() || null
    const longDesc_en = String(formData.get('longDesc_en') || '').trim() || null
    const longDesc_ru = String(formData.get('longDesc_ru') || '').trim() || null
    const metaTitle = String(formData.get('metaTitle') || '').trim() || null
    const metaTitle_en = String(formData.get('metaTitle_en') || '').trim() || null
    const metaTitle_ru = String(formData.get('metaTitle_ru') || '').trim() || null
    const metaDescription = String(formData.get('metaDescription') || '').trim() || null
    const metaDescription_en = String(formData.get('metaDescription_en') || '').trim() || null
    const metaDescription_ru = String(formData.get('metaDescription_ru') || '').trim() || null
    const ogTitle = String(formData.get('ogTitle') || '').trim() || null
    const ogTitle_en = String(formData.get('ogTitle_en') || '').trim() || null
    const ogTitle_ru = String(formData.get('ogTitle_ru') || '').trim() || null
    const ogDescription = String(formData.get('ogDescription') || '').trim() || null
    const ogDescription_en = String(formData.get('ogDescription_en') || '').trim() || null
    const ogDescription_ru = String(formData.get('ogDescription_ru') || '').trim() || null
    const logoUrl = String(formData.get('logoUrl') || '').trim() || null
    const website = String(formData.get('website') || '').trim() || null
    const phone = String(formData.get('phone') || '').trim() || null
    const email = String(formData.get('email') || '').trim() || null
    const address = String(formData.get('address') || '').trim() || null
    const mapLink = String(formData.get('mapLink') || '').trim() || null
    const slug = String(formData.get('slug') || '').trim()
    const slug_en = String(formData.get('slug_en') || '').trim()
    const slug_ru = String(formData.get('slug_ru') || '').trim()

    try {
      await prisma.company.update({
        where: { id: resolvedCompany.id },
        data: {
          name,
          slug: slug || resolvedCompany.slug,
          description: description || undefined,
          shortDesc: shortDesc || undefined,
          longDesc: longDesc || undefined,
          logoUrl: logoUrl || undefined,
          website: website || undefined,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          mapLink: mapLink || undefined,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          ogTitle: ogTitle || undefined,
          ogDescription: ogDescription || undefined,
        },
      })

      // Upsert translations (EN/RU) separately to avoid nested write issues
      const client: any = prisma as any
      if (client.companyTranslation) {
        const tx: Promise<any>[] = []
        const enMetaTitle = metaTitle_en || metaTitle
        const enMetaDescription = metaDescription_en || metaDescription
        const enOgTitle = ogTitle_en || ogTitle
        const enOgDescription = ogDescription_en || ogDescription

        tx.push(client.companyTranslation.upsert({
          where: { companyId_locale: { companyId: resolvedCompany.id, locale: 'en' } },
          create: {
            companyId: resolvedCompany.id,
            locale: 'en',
            name: name_en || name,
            slug: slug_en || ((slug || resolvedCompany.slug) + '-en'),
            description: description_en,
            shortDesc: shortDesc_en,
            longDesc: longDesc_en,
            metaTitle: enMetaTitle,
            metaDescription: enMetaDescription,
            ogTitle: enOgTitle,
            ogDescription: enOgDescription,
          },
          update: {
            name: name_en || name,
            slug: slug_en || ((slug || resolvedCompany.slug) + '-en'),
            description: description_en,
            shortDesc: shortDesc_en,
            longDesc: longDesc_en,
            metaTitle: enMetaTitle,
            metaDescription: enMetaDescription,
            ogTitle: enOgTitle,
            ogDescription: enOgDescription,
          },
        }))

        const ruMetaTitle = metaTitle_ru || metaTitle
        const ruMetaDescription = metaDescription_ru || metaDescription
        const ruOgTitle = ogTitle_ru || ogTitle
        const ruOgDescription = ogDescription_ru || ogDescription

        tx.push(client.companyTranslation.upsert({
          where: { companyId_locale: { companyId: resolvedCompany.id, locale: 'ru' } },
          create: {
            companyId: resolvedCompany.id,
            locale: 'ru',
            name: name_ru || name,
            slug: slug_ru || ((slug || resolvedCompany.slug) + '-ru'),
            description: description_ru,
            shortDesc: shortDesc_ru,
            longDesc: longDesc_ru,
            metaTitle: ruMetaTitle,
            metaDescription: ruMetaDescription,
            ogTitle: ruOgTitle,
            ogDescription: ruOgDescription,
          },
          update: {
            name: name_ru || name,
            slug: slug_ru || ((slug || resolvedCompany.slug) + '-ru'),
            description: description_ru,
            shortDesc: shortDesc_ru,
            longDesc: longDesc_ru,
            metaTitle: ruMetaTitle,
            metaDescription: ruMetaDescription,
            ogTitle: ruOgTitle,
            ogDescription: ruOgDescription,
          },
        }))
        await Promise.all(tx)
      }
    } catch (e) {
      const msg = (e as any)?.message || 'Update failed'
      return { error: msg }
    }

    revalidatePath('/')
    return { success: true }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Company Profile</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <CompanyEditForm company={resolvedCompany} translations={translations as any} updateAction={updateCompany} />
          </div>
        </div>
        <CompanyProfileManagement locale={locale} />
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic";




