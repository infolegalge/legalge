import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import SessionWrapper from "./SessionWrapper";

export default async function SpecialistProfilePage({ 
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

  await params;

  return <SessionWrapper />;
}

export const dynamic = "force-dynamic";

