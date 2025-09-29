/// <reference types="next-intl" />

import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: (DefaultSession["user"] & {
      id?: string;
      role?: Role;
      companySlug?: string | null;
      lawyerSlug?: string | null;
    }) | null;
  }
}

