import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import SpecialistDashboard from "./SpecialistDashboard";

export default async function SpecialistPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/auth/signin');
  }
  
  const userRole = (session.user as any)?.role;
  const allowedRoles = ['SPECIALIST', 'SUPER_ADMIN'];
  
  if (!allowedRoles.includes(userRole)) {
    redirect('/');
  }

  const { locale } = await params;

  return <SpecialistDashboard locale={locale} />;
}

export const dynamic = "force-dynamic";

