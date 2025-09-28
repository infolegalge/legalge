import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: (DefaultSession["user"] & {
      id?: string;
      role?: "SUBSCRIBER" | "SPECIALIST" | "COMPANY" | "SUPER_ADMIN";
      companySlug?: string | null;
      lawyerSlug?: string | null;
    }) | null;
  }

  interface User extends DefaultUser {
    role?: "SUBSCRIBER" | "SPECIALIST" | "COMPANY" | "SUPER_ADMIN";
    companySlug?: string | null;
    lawyerSlug?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: "SUBSCRIBER" | "SPECIALIST" | "COMPANY" | "SUPER_ADMIN";
    companySlug?: string | null;
    lawyerSlug?: string | null;
  }
}


