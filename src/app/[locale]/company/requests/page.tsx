import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import CompanyRequestsManagement from "./CompanyRequestsManagement";

export default async function CompanyRequestsPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['COMPANY', 'SUPER_ADMIN'].includes((session.user as any)?.role)) {
    redirect('/');
  }

  const { locale } = await params;

  return <CompanyRequestsManagement locale={locale} />;
}

export const dynamic = "force-dynamic";
