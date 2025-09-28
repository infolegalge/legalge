import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import SpecialistPostsManagement from "./SpecialistPostsManagement";

export default async function SpecialistPostsPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  const session = await getServerSession(authOptions);
  
  const userRole = (session?.user as any)?.role;
  const allowedRoles = ['SPECIALIST', 'SUPER_ADMIN'];
  
  if (!session || !allowedRoles.includes(userRole)) {
    redirect('/');
  }

  const { locale } = await params;

  return <SpecialistPostsManagement locale={locale} />;
}

export const dynamic = "force-dynamic";

