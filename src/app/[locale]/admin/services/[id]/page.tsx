import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import ServiceEditorClient from "./ServiceEditorClient";

export default async function ServiceEdit({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  const service = await prisma.service.findUnique({ 
    where: { id }, 
    include: { 
      translations: true, 
      practiceArea: true, 
      specialists: true 
    } 
  });
  
  if (!service) return <div className="p-4">Service not found</div>;
  
  const practices = await prisma.practiceArea.findMany({ orderBy: { title: "asc" } });
  const allSpecialists = await prisma.specialistProfile.findMany({ orderBy: { name: "asc" } });

  return (
    <ServiceEditorClient 
      service={service}
      practices={practices}
      allSpecialists={allSpecialists}
      locale={locale}
    />
  );
}


