import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import CompanyBioApproval from "./CompanyBioApproval";

export default async function CompanyBioApprovalPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any)?.role !== 'COMPANY') {
    redirect('/');
  }

  const { locale } = await params;

  return <CompanyBioApproval locale={locale} />;
}

export const dynamic = "force-dynamic";
