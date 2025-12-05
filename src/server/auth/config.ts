import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
// @ts-expect-error bcryptjs types are missing
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";

import { db } from "~/server/db";

// Temporary fix for PrismaAdapter type mismatch
const adapter = PrismaAdapter(db) as Adapter;

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "ADMIN" | "CUSTOMER" | "PROVIDER";
    } & DefaultSession["user"];
  }
  
  interface User {
    id: string;
    email?: string | null;
    image?: string | null;
    role: "ADMIN" | "CUSTOMER" | "PROVIDER";
  }
  
  interface AdapterUser extends User {
    emailVerified: Date | null;
  }
  
  interface JWT {
    id: string;
    role: "ADMIN" | "CUSTOMER" | "PROVIDER";
    sub: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.password) return null;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: undefined,
          image: user.image ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  adapter: adapter,
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.role) {
        session.user.role = token.role as "ADMIN" | "CUSTOMER" | "PROVIDER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
