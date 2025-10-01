import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import ServiceCreateClient from "../ServiceCreateClient";

export const dynamic = "force-dynamic";

export default async function ServiceCreatePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const practices = await prisma.practiceArea.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } });
  if (practices.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">New Service</h1>
        <p className="text-muted-foreground">Create at least one practice area before adding services.</p>
      </div>
    );
  }
  return <ServiceCreateClient practices={practices} locale={locale} />;
}
