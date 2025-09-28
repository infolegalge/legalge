"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Trash2, Edit } from "lucide-react";
import type { Locale } from "@/i18n/locales";
import Fuse from "fuse.js";

type Service = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  practiceArea: {
    title: string;
  };
  translations: Array<{
    id: string;
    locale: string;
    title: string;
    slug: string;
  }>;
};

type ServicesListProps = {
  locale: Locale;
  services: Service[];
};

export default function ServicesList({ locale, services }: ServicesListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Create searchable data with all titles and descriptions
  const searchableServices = useMemo(() => {
    return services.map(service => ({
      ...service,
      searchText: [
        service.title,
        service.description || "",
        service.practiceArea.title,
        ...service.translations.map(t => t.title),
        ...service.translations.map(t => t.slug),
        service.slug
      ].join(" ")
    }));
  }, [services]);

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(searchableServices, {
        keys: ["title", "description", "practiceArea.title", "searchText"],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: true,
      }),
    [searchableServices],
  );

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [fuse, services, searchQuery]);

  // Group filtered services by practice area
  const servicesByPracticeArea = useMemo(() => {
    return filteredServices.reduce((acc, service) => {
      const practiceAreaTitle = service.practiceArea.title;
      if (!acc[practiceAreaTitle]) {
        acc[practiceAreaTitle] = [];
      }
      acc[practiceAreaTitle].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [filteredServices]);

  const handleDelete = async (serviceId: string, serviceTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${serviceTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the page to show updated list
        window.location.reload();
      } else {
        const error = await response.text();
        alert(`Failed to delete service: ${error}`);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search services by title, description, or practice area..."
          aria-label="Search services"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {searchQuery.trim() 
            ? `Found ${filteredServices.length} of ${services.length} services`
            : `Total: ${services.length} services`
          }
        </span>
      </div>

      {/* Services List */}
      {Object.keys(servicesByPracticeArea).length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            {searchQuery.trim() ? "No services found" : "No services available"}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery.trim() 
              ? "Try adjusting your search terms or clearing the search."
              : "Services are automatically created when you add practice areas."
            }
          </p>
          {searchQuery.trim() && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(servicesByPracticeArea).map(([practiceAreaTitle, practiceServices]) => (
            <div key={practiceAreaTitle} className="rounded-lg border bg-card">
              <div className="border-b bg-muted/50 px-6 py-4">
                <h2 className="text-xl font-semibold">{practiceAreaTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {practiceServices.length} services
                </p>
              </div>
              
              <div className="divide-y">
                {practiceServices.map((service) => (
                  <div key={service.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium">{service.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {service.description || "No description available"}
                        </p>
                        
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                            {service.slug}
                          </span>
                          {service.translations.map((translation) => (
                            <span 
                              key={translation.id} 
                              className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                            >
                              {translation.locale}: {translation.slug}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex space-x-2">
                        <Link
                          href={`/${locale}/admin/services/${service.id}`}
                          className="flex items-center gap-2 rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(service.id, service.title)}
                          className="flex items-center gap-2 rounded bg-destructive px-3 py-1 text-sm text-destructive-foreground hover:bg-destructive/90"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
