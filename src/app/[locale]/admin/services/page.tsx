import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import ServicesList from "./ServicesList";

export default async function ServicesAdmin({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  
  const services = await prisma.service.findMany({
    include: {
      practiceArea: true,
      translations: true,
    },
    orderBy: {
      practiceArea: { title: "asc" },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Services Management</h1>
        <p className="mt-2 text-foreground/70">Manage all legal services across practice areas</p>
      </div>

      <ServicesList locale={locale} services={services} />
    </div>
  );
}