import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (!req.cookies.get("__nt_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
}
export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };