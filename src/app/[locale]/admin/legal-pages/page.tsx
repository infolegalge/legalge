import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { Locale } from "@/i18n/locales";
import LegalPagesManagement from "./LegalPagesManagement";
import prisma from "@/lib/prisma";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }
}

async function getLegalPages() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
  return prisma.legalPage.findMany({ orderBy: { createdAt: "desc" }, include: { translations: true } });
}

export default async function LegalPagesAdminPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  await requireSuperAdmin();
  const { locale } = await params;
  
  let legalPages = [];
  try {
    legalPages = await getLegalPages();
  } catch (error) {
    console.error('Error fetching legal pages:', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Legal Pages Management</h2>
        <p className="text-muted-foreground">Manage Terms of Service, Privacy Policy, and other legal pages</p>
      </div>

      <LegalPagesManagement 
        initialLegalPages={legalPages}
        locale={locale}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
