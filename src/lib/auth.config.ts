import type { NextAuthConfig } from "next-auth";

/**
 * Config compartida sin dependencias de Node (Prisma/bcrypt),
 * segura para el middleware (edge runtime).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.businessId = user.businessId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.disabled || !token.sub || !token.role) {
          session.user.id = "";
          session.user.role = "BUSINESS_OWNER";
          session.user.businessId = null;
          return session;
        }
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.businessId = token.businessId ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
