import { NextResponse, type NextRequest } from "next/server";
import { auth } from "./src/server/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await auth();

  const redirectToSignIn = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/signin";
    url.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(url);
  };

  // Admin-only
  if (pathname.startsWith("/admin")) {
    if (!session?.user) return redirectToSignIn();
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/customer", req.url));
    }
    return NextResponse.next();
  }

  // Provider-only
  if (pathname.startsWith("/provider")) {
    if (!session?.user) return redirectToSignIn();
    if (session.user.role !== "PROVIDER") {
      return NextResponse.redirect(new URL("/customer", req.url));
    }
    return NextResponse.next();
  }

  // Customer-only
  if (pathname.startsWith("/customer")) {
    if (!session?.user) return redirectToSignIn();
    if (session.user.role !== "CUSTOMER") {
      // Allow admins to access customer pages? Strict RBAC: redirect
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/provider/:path*", "/customer/:path*"],
};