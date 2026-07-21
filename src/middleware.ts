import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAppRoute = createRouteMatcher(["/app(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const PROXY_URL = (() => {
  const raw =
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim() ||
    (process.env.VERCEL_ENV === "production"
      ? "https://konnect.kmd.agency/__clerk"
      : undefined);
  return raw ? raw.replace(/\/$/, "") : undefined;
})();

/**
 * Clerk autentica; role/businessId en layouts + Server Actions (Prisma).
 * frontendApiProxy obligatorio: FAPI está en clerk.kmd.agency sin DNS;
 * el browser habla con /__clerk en konnect.kmd.agency.
 */
export default clerkMiddleware(
  async (auth, req) => {
    if (isAppRoute(req) || isAdminRoute(req)) {
      const session = await auth();
      if (!session.userId) {
        const login = new URL("/login", req.url);
        login.searchParams.set(
          "callbackUrl",
          `${req.nextUrl.pathname}${req.nextUrl.search}`,
        );
        return NextResponse.redirect(login);
      }
    }
    return NextResponse.next();
  },
  {
    frontendApiProxy: {
      enabled: true,
    },
    ...(PROXY_URL ? { proxyUrl: PROXY_URL } : {}),
    signInUrl: "/login",
    signUpUrl: "/signup",
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
