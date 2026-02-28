import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export function validateApiKey(request: Request): NextResponse | null {
  const apiKey = process.env.API_KEY

  // Check x-api-key header (direct API calls)
  const xApiKey = request.headers.get("x-api-key")
  if (xApiKey && apiKey && safeEqual(xApiKey, apiKey)) return null

  // Check Authorization: ApiKey <key> (HappyRobot platform)
  const auth = request.headers.get("authorization")
  if (auth) {
    const match = auth.match(/^ApiKey\s+(.+)$/i)
    if (match && apiKey && safeEqual(match[1], apiKey)) return null
  }

  // Check Basic Auth (dashboard browser session — already validated by middleware)
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6))
    const [user, pass] = decoded.split(":")
    const expectedPassword = process.env.DASHBOARD_PASSWORD
    if (expectedPassword && user === "admin" && safeEqual(pass, expectedPassword)) return null
  }

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}
