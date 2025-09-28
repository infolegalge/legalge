'use client';

import { useState } from 'react';
import Link from "next/link";
import { Edit, Building2, Users, FileText } from "lucide-react";
import DeleteCompanyButton from "./DeleteCompanyButton";

interface Company {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  _count: {
    specialists: number;
    posts: number;
  };
}

interface CompaniesListProps {
  companies: Company[];
  locale: string;
}

export default function CompaniesList({ companies, locale }: CompaniesListProps) {
  const [companiesList, setCompaniesList] = useState(companies);

  const handleCompanyDeleted = (deletedCompanyId: string) => {
    setCompaniesList(prev => prev.filter(company => company.id !== deletedCompanyId));
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {companiesList.map((company) => (
        <div key={company.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">{company.name}</h3>
                {company.city && (
                  <p className="text-sm text-muted-foreground">{company.city}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {company._count.specialists} specialists
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {company._count.posts} posts
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <Link
              href={`/${locale}/admin/companies/${company.id}/edit`}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-muted"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Link>
            <DeleteCompanyButton
              companyId={company.id}
              companyName={company.name}
              onDelete={() => handleCompanyDeleted(company.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
