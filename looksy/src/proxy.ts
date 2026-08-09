import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const locale = request.nextUrl.searchParams.get("locale");
    const theme = request.nextUrl.searchParams.get("theme");
    const hasOverride = locale === "en" || locale === "ru" || theme === "dark" || theme === "light";
    if (hasOverride) {
      const response = NextResponse.next();
      if (locale === "en" || locale === "ru") {
        response.cookies.set("looksy.locale", locale, { path: "/" });
      }
      if (theme === "dark" || theme === "light") {
        response.cookies.set("looksy.theme", theme, { path: "/" });
      }
      return response;
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
