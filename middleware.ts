import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function isValidBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Basic ")) return false

  const base64 = authHeader.slice(6)
  const decoded = atob(base64)
  const [user, pass] = decoded.split(":")

  const expectedPassword = process.env.DASHBOARD_PASSWORD
  if (!expectedPassword) return true // no password configured = open access

  return user === "admin" && pass === expectedPassword
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth for API routes, static assets, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|gif)$/)
  ) {
    return NextResponse.next()
  }

  // Dashboard pages require Basic Auth
  if (!isValidBasicAuth(request)) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="HappyRobot Dashboard"',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
