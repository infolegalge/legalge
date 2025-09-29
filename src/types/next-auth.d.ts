import type { Role } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: (DefaultSession["user"] & {
      id?: string;
      role?: Role;
      companySlug?: string | null;
      lawyerSlug?: string | null;
    }) | null;
  }

  interface User extends DefaultUser {
    role?: Role;
    companySlug?: string | null;
    lawyerSlug?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: Role;
    companySlug?: string | null;
    lawyerSlug?: string | null;
  }
}


