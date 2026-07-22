import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { expireClerkCookiesOnResponse } from "@/lib/clerk-cookies";

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
 * frontendApiProxy: FAPI en clerk.kmd.agency sin DNS;
 * el browser habla con /__clerk en konnect.kmd.agency.
 * proxyUrl también vía env: el JWT iss es el proxy y auth() del servidor
 * necesita conocerlo para el handshake.
 */
const clerkHandler = clerkMiddleware(
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

/**
 * Si el handshake se reentra (redirect_url ya es otro handshake) o la URL
 * explota, cortamos el loop, borramos __session HttpOnly y volvemos a login.
 * Motivo típico: session-token-but-no-client-uat.
 */
function isNestedHandshake(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/__clerk/v1/client/handshake")) {
    return false;
  }
  if (req.url.length > 8000) return true;

  const redirectUrl = req.nextUrl.searchParams.get("redirect_url") ?? "";
  try {
    const decoded = decodeURIComponent(redirectUrl);
    if (decoded.includes("/__clerk/v1/client/handshake")) return true;
  } catch {
    if (redirectUrl.includes("handshake")) return true;
  }
  return false;
}

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isNestedHandshake(req)) {
    const login = new URL("/login", req.url);
    login.searchParams.set("authError", "handshake_loop");
    login.searchParams.set("callbackUrl", "/app/dashboard");
    const res = NextResponse.redirect(login);
    return expireClerkCookiesOnResponse(res, req);
  }

  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
