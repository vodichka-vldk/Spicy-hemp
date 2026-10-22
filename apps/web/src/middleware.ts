import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, adminConfigured, verifySession } from "@/lib/admin-auth";
import { detectLocale, isLocale } from "@/lib/i18n";

const PUBLIC_FILE = /\.[a-z0-9]+$/i;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!adminConfigured()) {
      if (process.env.NODE_ENV === "production") return new NextResponse("Адмінку вимкнено: задайте ADMIN_PASSWORD", { status: 503 });
      return NextResponse.next(); // open in local development
    }
    if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
    if (pathname.startsWith("/api/admin")) return new NextResponse("Unauthorized", { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/p/") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    const res = NextResponse.next();
    res.cookies.set("lang", first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }

  const cookie = req.cookies.get("lang")?.value;
  const locale = isLocale(cookie) ? cookie : detectLocale(req.headers.get("accept-language"));
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
