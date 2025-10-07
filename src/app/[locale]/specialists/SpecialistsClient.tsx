'use client';

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Filter, Building2, User, X } from "lucide-react";
import SpecialistCard from "@/components/SpecialistCard";
import type { SpecialistProfile } from "@/lib/specialists";
import type { Locale } from "@/i18n/locales";

interface SpecialistsClientProps {
  initialSpecialists: SpecialistProfile[];
  locale: Locale;
}

export default function SpecialistsClient({ initialSpecialists, locale }: SpecialistsClientProps) {
  const t = useTranslations();
  
  const [specialists] = useState<SpecialistProfile[]>(initialSpecialists);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [activeView, setActiveView] = useState<"all" | "company" | "solo">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter dropdowns
  const companies = Array.from(new Set(specialists.filter(s => s.company).map(s => s.company!.name || ""))).filter(Boolean).sort();
  const specializations = Array.from(new Set(specialists.flatMap(s => s.specializations))).sort();
  const cities = Array.from(new Set(
    specialists
      .map(s => {
        // Use company city if specialist is part of a company, otherwise use specialist's own city
        return s.company?.city || s.city || '';
      })
      .filter(Boolean) // Remove empty values
  )).sort();

  // Filter specialists based on search and filters
  const filteredSpecialists = specialists.filter(specialist => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      specialist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
      specialist.company?.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Company filter
    const matchesCompany = selectedCompany === "all" || specialist.company?.name === selectedCompany;

    // Specialization filter
    const matchesSpecialization = selectedSpecialization === "all" || 
      specialist.specializations.includes(selectedSpecialization);

    // City filter - use company city if specialist is part of a company, otherwise use specialist's own city
    const specialistCity = specialist.company?.city || specialist.city;
    const matchesCity = selectedCity === "all" || specialistCity === selectedCity;

    return matchesSearch && matchesCompany && matchesSpecialization && matchesCity;
  });

  // Separate filtered specialists by company affiliation
  const companySpecialists = filteredSpecialists.filter(s => s.company);
  const soloSpecialists = filteredSpecialists.filter(s => !s.company);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCompany("all");
    setSelectedSpecialization("all");
    setSelectedCity("all");
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== "" || selectedCompany !== "all" || 
    selectedSpecialization !== "all" || selectedCity !== "all";

  const viewFilterOptions: Array<{ key: "all" | "company" | "solo"; label: string }> = [
    { key: "all", label: t("specialists.view_all", { default: "All" }) },
    { key: "company", label: t("specialists.view_company", { default: "Company" }) },
    { key: "solo", label: t("specialists.view_solo", { default: "Solo" }) },
  ];

  const viewFilters = (
    <div className="flex flex-wrap gap-2">
      {viewFilterOptions.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setActiveView(key)}
          className={`rounded-full border px-3 py-1 text-sm transition ${
            activeView === key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t("specialists.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("specialists.description")}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("specialists.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex gap-2">
            <button 
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              {t("specialists.filter")}
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {[searchQuery, selectedCompany, selectedSpecialization, selectedCity].filter(f => f !== "" && f !== "all").length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button 
                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
          {viewFilters}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 rounded-lg border bg-card p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Company Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Companies</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              {/* Specialization Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Specialization</label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Specializations</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t("specialists.total_specialists")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{filteredSpecialists.length}</p>
          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground">
              of {specialists.length} total
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t("specialists.company_specialists")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{companySpecialists.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t("specialists.solo_practitioners")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{soloSpecialists.length}</p>
        </div>
      </div>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="mb-6 rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredSpecialists.length} specialist{filteredSpecialists.length !== 1 ? 's' : ''} 
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCompany !== "all" && ` from ${selectedCompany}`}
            {selectedSpecialization !== "all" && ` specializing in ${selectedSpecialization}`}
            {selectedCity !== "all" && ` in ${selectedCity}`}
          </p>
        </div>
      )}

      {/* Company Specialists */}
      {(activeView === "all" || activeView === "company") && (
        <div className="mb-12">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{t("specialists.company_specialists")}</h2>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {companySpecialists.length}
            </span>
          </div>
          {companySpecialists.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {companySpecialists.map((specialist) => (
                <SpecialistCard
                  key={specialist.id}
                  specialist={specialist}
                  locale={locale}
                  showCompany={true}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              {t("specialists.no_company_results", { default: "No company specialists match the current filters." })}
            </div>
          )}
        </div>
      )}

      {/* Solo Practitioners */}
      {(activeView === "all" || activeView === "solo") && (
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{t("specialists.solo_practitioners")}</h2>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {soloSpecialists.length}
            </span>
          </div>
          {soloSpecialists.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {soloSpecialists.map((specialist) => (
                <SpecialistCard
                  key={specialist.id}
                  specialist={specialist}
                  locale={locale}
                  showCompany={false}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              {t("specialists.no_solo_results", { default: "No solo practitioners match the current filters." })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {filteredSpecialists.length === 0 && specialists.length > 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No specialists found</h3>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search criteria or filters
          </p>
          {hasActiveFilters && (
            <button 
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* No specialists at all */}
      {specialists.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t("specialists.no_specialists")}</h3>
          <p className="mt-2 text-muted-foreground">{t("specialists.no_specialists_description")}</p>
        </div>
      )}
    </div>
  );
}
