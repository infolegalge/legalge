'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteCompanyButtonProps {
  companyId: string;
  companyName: string;
  onDelete: () => void;
}

export default function DeleteCompanyButton({ companyId, companyName, onDelete }: DeleteCompanyButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${companyName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append('id', companyId);
      
      const response = await fetch('/api/admin/companies/delete', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onDelete();
      } else {
        alert('Failed to delete company');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Failed to delete company');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" />
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
