import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected staff routes
  if (pathname.startsWith("/staff") && pathname !== "/staff/login") {
    const token = request.cookies.get("access_token");
    const userData = request.cookies.get("user_data");

    // Redirect to login if not authenticated
    if (!token || !userData) {
      const loginUrl = new URL("/staff/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const user = JSON.parse(userData.value);

      // Check if user has staff or admin role
      if (user.role !== "staff" && user.role !== "admin") {
        const loginUrl = new URL("/staff/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/staff/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect to dashboard if already logged in and trying to access login page
  if (pathname === "/staff/login") {
    const token = request.cookies.get("access_token");
    const userData = request.cookies.get("user_data");

    if (token && userData) {
      try {
        const user = JSON.parse(userData.value);

        if (user.role === "staff" || user.role === "admin") {
          const dashboardUrl = new URL("/staff/dashboard", request.url);
          return NextResponse.redirect(dashboardUrl);
        }
      } catch {
        // Continue to login page if parsing fails
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
