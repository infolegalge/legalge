/// <reference types="next-intl" />

import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR";
      companySlug?: string | null;
      lawyerSlug?: string | null;
    };
  }
}

