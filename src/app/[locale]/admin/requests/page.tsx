import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import RequestsManagement from "./RequestsManagement";

export default async function RequestsAdminPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const { locale } = await params;

  return <RequestsManagement locale={locale} />;
}

export const dynamic = "force-dynamic";




