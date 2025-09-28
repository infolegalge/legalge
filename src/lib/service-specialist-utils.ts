import prisma from "./prisma";

/**
 * Utility functions for managing bidirectional service-specialist relationships
 */

/**
 * Assign a specialist to a service (and automatically assign the service to the specialist)
 */
export async function assignSpecialistToService(serviceId: string, specialistId: string) {
  return await prisma.service.update({
    where: { id: serviceId },
    data: {
      specialists: {
        connect: { id: specialistId }
      }
    },
    include: { specialists: true }
  });
}

/**
 * Remove a specialist from a service (and automatically remove the service from the specialist)
 */
export async function removeSpecialistFromService(serviceId: string, specialistId: string) {
  return await prisma.service.update({
    where: { id: serviceId },
    data: {
      specialists: {
        disconnect: { id: specialistId }
      }
    },
    include: { specialists: true }
  });
}

/**
 * Assign multiple specialists to a service
 */
export async function assignSpecialistsToService(serviceId: string, specialistIds: string[]) {
  return await prisma.service.update({
    where: { id: serviceId },
    data: {
      specialists: {
        set: specialistIds.map(id => ({ id }))
      }
    },
    include: { specialists: true }
  });
}

/**
 * Assign multiple services to a specialist
 */
export async function assignServicesToSpecialist(specialistId: string, serviceIds: string[]) {
  return await prisma.specialistProfile.update({
    where: { id: specialistId },
    data: {
      services: {
        set: serviceIds.map(id => ({ id }))
      }
    },
    include: { services: true }
  });
}

/**
 * Get all services for a specialist with full details
 */
export async function getSpecialistServices(specialistId: string, locale?: string) {
  const specialist = await prisma.specialistProfile.findUnique({
    where: { id: specialistId },
    include: {
      services: {
        include: {
          practiceArea: {
            include: { translations: true }
          },
          translations: true
        }
      }
    }
  });

  if (!specialist) return [];

  // If locale is specified, filter and format the services for that locale
  if (locale) {
    return specialist.services.map(service => {
      const translation = service.translations.find(t => t.locale === locale);
      const practiceTranslation = service.practiceArea.translations.find(t => t.locale === locale);
      
      return {
        id: service.id,
        slug: translation?.slug || service.slug,
        title: translation?.title || service.title,
        description: translation?.description || service.description,
        practiceArea: {
          id: service.practiceArea.id,
          slug: practiceTranslation?.slug || service.practiceArea.slug,
          title: practiceTranslation?.title || service.practiceArea.title,
        }
      };
    });
  }

  return specialist.services;
}

/**
 * Get all specialists for a service with full details
 */
export async function getServiceSpecialists(serviceId: string, locale?: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      specialists: {
        include: { translations: true }
      }
    }
  });

  if (!service) return [];

  // If locale is specified, filter and format the specialists for that locale
  if (locale) {
    return service.specialists.map(specialist => {
      const translation = specialist.translations.find(t => t.locale === locale);
      
      return {
        id: specialist.id,
        slug: translation?.slug || specialist.slug,
        name: translation?.name || specialist.name,
        role: translation?.role || specialist.role,
        bio: translation?.bio || specialist.bio,
        avatarUrl: specialist.avatarUrl,
        contactEmail: specialist.contactEmail,
        contactPhone: specialist.contactPhone,
        city: specialist.city,
      };
    });
  }

  return service.specialists;
}

/**
 * Sync specialist-service relationships (useful for bulk operations)
 */
export async function syncSpecialistServiceRelationships(serviceId: string, specialistIds: string[]) {
  // This will automatically handle the bidirectional relationship
  return await prisma.service.update({
    where: { id: serviceId },
    data: {
      specialists: {
        set: specialistIds.map(id => ({ id }))
      }
    },
    include: { specialists: true }
  });
}
