"use server";

/**
 * Login / signup viven en Clerk (`SignIn` / `SignUp` en /login y /signup).
 * La sync a Prisma ocurre en el webhook `/api/webhooks/clerk` y en `auth()`.
 */

export async function signup() {
  return {
    ok: false as const,
    error: "Usa el formulario de Clerk en /signup.",
  };
}

export async function login() {
  return {
    ok: false as const,
    error: "Usa el formulario de Clerk en /login.",
  };
}
