"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { Locale } from "@/i18n/locales";
import { ChevronRight, FileText, Briefcase, Users, Globe, Scale, Shield, Building, Car, Home, Search } from "lucide-react";
import Fuse from "fuse.js";

type Service = {
  id: string;
  slug: string;
  title: string;
  searchTitles?: string[];
};

interface ServicesSidebarProps {
  locale: Locale;
  services: Service[];
  title?: string;
  currentServiceSlug?: string;
  className?: string;
}

// Icon mapping for different service types
const getServiceIcon = (title: string) => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('visa') || lowerTitle.includes('residency') || lowerTitle.includes('citizenship')) {
    return <Globe className="h-4 w-4" />;
  }
  if (lowerTitle.includes('business') || lowerTitle.includes('investment') || lowerTitle.includes('company')) {
    return <Building className="h-4 w-4" />;
  }
  if (lowerTitle.includes('family') || lowerTitle.includes('reunification')) {
    return <Users className="h-4 w-4" />;
  }
  if (lowerTitle.includes('work') || lowerTitle.includes('permit')) {
    return <Briefcase className="h-4 w-4" />;
  }
  if (lowerTitle.includes('property') || lowerTitle.includes('real estate')) {
    return <Home className="h-4 w-4" />;
  }
  if (lowerTitle.includes('tax') || lowerTitle.includes('financial')) {
    return <Scale className="h-4 w-4" />;
  }
  if (lowerTitle.includes('translation') || lowerTitle.includes('interpretation')) {
    return <FileText className="h-4 w-4" />;
  }
  if (lowerTitle.includes('dispute') || lowerTitle.includes('appeal')) {
    return <Shield className="h-4 w-4" />;
  }
  if (lowerTitle.includes('compliance') || lowerTitle.includes('legalization')) {
    return <Shield className="h-4 w-4" />;
  }
  if (lowerTitle.includes('digital nomad')) {
    return <Car className="h-4 w-4" />;
  }
  
  return <FileText className="h-4 w-4" />;
};

export default function ServicesSidebar({ 
  locale, 
  services, 
  title = "Services", 
  currentServiceSlug,
  className = ""
}: ServicesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(services, {
        keys: ["title", "searchTitles"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [services],
  );

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [fuse, services, searchQuery]);

  return (
    <aside className={`space-y-4 ${className}`}>
      <div className="border-b border-border/50 pb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} {searchQuery.trim() ? 'found' : 'available'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search services..."
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
      
      {services.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No services listed yet.</p>
        </div>
      ) : filteredServices.length === 0 && searchQuery.trim() ? (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No services found for &ldquo;{searchQuery}&rdquo;</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <nav className="space-y-1">
          {filteredServices.map((service) => {
            const isActive = currentServiceSlug === service.slug;
            
            return (
              <Link
                key={service.id}
                href={`/${locale}/services/${service.slug}`}
                className={`
                  group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-foreground hover:bg-muted/80 hover:text-foreground'
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200
                  ${isActive 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }
                `}>
                  {getServiceIcon(service.title)}
                </div>
                
                <span className="flex-1 truncate">{service.title}</span>
                
                <ChevronRight className={`
                  h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5
                  ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/50 group-hover:text-primary'}
                `} />
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </aside>
  );
}
