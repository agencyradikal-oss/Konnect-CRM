"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { sanitizeUserText } from "@/lib/sanitize";

const signupSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(120),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

/** Solo paths relativos internos (evita open redirect). */
function safeCallbackUrl(url: string | undefined, fallback: string) {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return fallback;
  return url;
}

export async function signup(input: unknown) {
  const data = signupSchema.parse(input);
  const name = sanitizeUserText(data.name, 120);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { ok: false as const, error: "Ese email ya está registrado." };

  await prisma.user.create({
    data: {
      name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: "BUSINESS_OWNER",
    },
  });

  void sendWelcomeEmail({ to: data.email, name }).catch((err) =>
    console.error("[auth] welcome email:", err),
  );

  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirectTo: "/registrar-empresa",
  });

  return { ok: true as const };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  callbackUrl: z.string().optional(),
});

export async function login(input: unknown) {
  const data = loginSchema.parse(input);
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: safeCallbackUrl(data.callbackUrl, "/app/dashboard"),
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false as const, error: "Email o contraseña incorrectos." };
    }
    throw error; // NEXT_REDIRECT en éxito
  }
}
