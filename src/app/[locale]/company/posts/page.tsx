import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import CompanyPostsManagement from "./CompanyPostsManagement";

export default async function CompanyPostsPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any)?.role !== 'COMPANY') {
    redirect('/');
  }

  const { locale } = await params;

  return <CompanyPostsManagement locale={locale} />;
}

export const dynamic = "force-dynamic";




