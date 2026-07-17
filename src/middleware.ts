import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;

  // /app/* requiere sesión con businessId
  if (nextUrl.pathname.startsWith("/app")) {
    if (!user) {
      const login = new URL("/login", nextUrl);
      login.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(login);
    }
    if (!user.businessId && user.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/registrar-empresa", nextUrl));
    }
  }

  // /admin/* requiere SUPER_ADMIN
  if (nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const login = new URL("/login", nextUrl);
      login.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(login);
    }
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
