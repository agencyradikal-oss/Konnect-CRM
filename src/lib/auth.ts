import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const googleEnabled =
  !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.businessId,
        };
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Google: asegurar que el usuario exista en la DB
      if (account?.provider === "google" && user.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined },
          create: {
            email: user.email,
            name: user.name,
            role: "BUSINESS_OWNER",
          },
        });
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (dbUser) {
            token.sub = dbUser.id;
            token.role = dbUser.role;
            token.businessId = dbUser.businessId;
          }
        } else {
          token.role = user.role;
          token.businessId = user.businessId;
        }
      }
      // Refresh tras registrar negocio (unstable_update)
      if (trigger === "update" && session?.user?.businessId) {
        token.businessId = session.user.businessId;
      }
      // Si el JWT aún no tiene tenant pero la DB sí (post-onboarding), sincroniza.
      if (token.sub && !token.businessId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { businessId: true, role: true },
        });
        if (dbUser?.businessId) {
          token.businessId = dbUser.businessId;
          token.role = dbUser.role;
        }
      }
      return token;
    },
  },
});

/** Sesión con businessId garantizado — para Server Actions del CRM. */
export async function requireBusinessSession() {
  const { getCurrentBusiness } = await import("@/lib/tenant");
  const { session, businessId } = await getCurrentBusiness();
  return { session, businessId };
}

/** Sesión SUPER_ADMIN — para el panel /admin. */
export async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("No autorizado: se requiere SUPER_ADMIN.");
  }
  return session;
}
