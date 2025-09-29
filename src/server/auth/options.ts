import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/server/db/prisma";
import { verifyPassword } from "@/server/auth/auth-utils";

const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "";

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    // req is unused but part of the provider signature in NextAuth v5
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email }
      });

      if (!user || !user.password) {
        return null;
      }

      const isPasswordValid = await verifyPassword(credentials.password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
        companySlug: user.companySlug,
      };
    }
  })
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-secret" : undefined),
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (existingUser) {
          try {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }
            });
          } catch {
            // ignore
          }
          user.id = existingUser.id;
          return true;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companySlug = token.companySlug ?? null;
        session.user.lawyerSlug = token.lawyerSlug ?? null;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string | undefined;
        token.role = user.role;
        token.companySlug = (user as { companySlug?: string | null }).companySlug ?? null;
        token.lawyerSlug = (user as { lawyerSlug?: string | null }).lawyerSlug ?? null;
      }
      if (token.email && token.companySlug === undefined) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, role: true, companySlug: true, lawyerSlug: true }
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role as typeof token.role;
            token.companySlug = dbUser.companySlug ?? null;
            token.lawyerSlug = dbUser.lawyerSlug ?? null;
          }
        } catch {}
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        const email = user?.email as string | undefined;
        if (email && email === superAdminEmail) {
          await prisma.user.update({ where: { id: user.id! }, data: { role: "SUPER_ADMIN" } });
        }
      } catch {}
    },
    async signIn({ user }) {
      try {
        const email = user?.email as string | undefined;
        if (email && email === superAdminEmail) {
          await prisma.user.updateMany({ where: { email }, data: { role: "SUPER_ADMIN" } });
        }
      } catch {}
    },
  },
};






