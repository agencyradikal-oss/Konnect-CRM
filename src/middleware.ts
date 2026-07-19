import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAppRoute = createRouteMatcher(["/app(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

/**
 * Clerk autentica; role/businessId se validan en layouts + Server Actions (Prisma).
 * frontendApiProxy: FAPI vía /__clerk (sin CNAME clerk.kmd.agency).
 */
export default clerkMiddleware(
  async (auth, req) => {
    if (isAppRoute(req) || isAdminRoute(req)) {
      const session = await auth();
      if (!session.userId) {
        return session.redirectToSignIn({ returnBackUrl: req.url });
      }
    }
    return NextResponse.next();
  },
  {
    frontendApiProxy: {
      enabled: true,
    },
  },
);

export const config = {
  matcher: [
    // App + handshake de Clerk
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Proxy Frontend API
    "/__clerk/(.*)",
  ],
};
