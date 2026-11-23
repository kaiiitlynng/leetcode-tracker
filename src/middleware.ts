import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];

/**
 * Fast gate: no session cookie means no access. It can't check the database here, so every
 * page, action and API route still verifies the session itself (requireUser / getCurrentUser).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname) || request.cookies.has("session")) return NextResponse.next();
  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
