"use client";

import { useState, useMemo } from "react";
import { Search, Check, X } from "lucide-react";

interface Service {
  id: string;
  title: string;
  slug?: string;
  practiceArea: {
    title: string;
  };
  translations?: Array<{
    locale: string;
    title: string;
    slug: string;
  }>;
}

interface ServiceSelectorProps {
  services: Service[];
  selectedServices: string[]; // Array of service IDs
  onChange: (selectedServices: string[]) => void;
  name: string;
  valueType?: 'id' | 'slug';
}

export default function ServiceSelector({ 
  services, 
  selectedServices, 
  onChange, 
  name,
  valueType = 'id',
}: ServiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedServices), [selectedServices]);

  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    const term = searchTerm.toLowerCase();
    return services.filter((service) => {
      const matchesBase = service.title?.toLowerCase().includes(term);
      const matchesPractice = service.practiceArea?.title?.toLowerCase().includes(term);
      const matchesTranslations = Array.isArray(service.translations)
        ? service.translations.some((t) =>
            t.title?.toLowerCase().includes(term) ||
            t.slug?.toLowerCase().includes(term)
          )
        : false;
      return Boolean(matchesBase || matchesPractice || matchesTranslations);
    });
  }, [services, searchTerm]);

  const toggleService = (serviceId: string) => {
    if (selectedSet.has(serviceId)) {
      onChange(selectedServices.filter((id) => id !== serviceId));
    } else {
      onChange([...selectedServices, serviceId]);
    }
  };

  const removeService = (serviceId: string) => {
    onChange(selectedServices.filter((id) => id !== serviceId));
  };

  const serviceMap = useMemo(() => {
    const map = new Map<string, Service>();
    services.forEach((service) => {
      map.set(service.id, service);
    });
    return map;
  }, [services]);

  const selectedObjects = selectedServices
    .map((id) => serviceMap.get(id))
    .filter((service): service is Service => Boolean(service));

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-sm font-medium">Specializations</label>
      
      {/* Selected Services */}
      {selectedObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedObjects.map((service) => (
            <span
              key={service.id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {service.title}
              <button
                type="button"
                onClick={() => removeService(service.id)}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search and Dropdown */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="w-full rounded border px-10 py-2 pr-4"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded border px-3 py-2 text-sm hover:bg-muted"
          >
            {isOpen ? "Close" : "Browse"}
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded border bg-popover text-popover-foreground shadow-lg">
            {filteredServices.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No services found</div>
            ) : (
              filteredServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${
                    selectedSet.has(service.id) ? 'bg-muted/70' : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleService(service.id)}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                    selectedSet.has(service.id)
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/40'
                  }`}>
                    {selectedSet.has(service.id) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold leading-tight text-foreground">
                      {service.title}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      {service.practiceArea.title}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Hidden inputs for form submission */}
      {selectedServices.map((serviceId) => {
        const service = services.find((s) => s.id === serviceId);
        const value = (() => {
          if (!service) {
            return serviceId;
          }

          if (valueType === 'slug') {
            return service.slug ?? service.id;
          }

          return service.id;
        })();
        return (
          <input
            key={`${serviceId}-${value}`}
            type="hidden"
            name={name}
            value={value}
          />
        );
      })}

      <p className="text-xs text-muted-foreground">
        {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
