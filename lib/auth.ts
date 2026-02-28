import { NextResponse } from "next/server"

export function validateApiKey(request: Request): NextResponse | null {
  // Check x-api-key header (direct API calls)
  const xApiKey = request.headers.get("x-api-key")
  if (xApiKey && xApiKey === process.env.API_KEY) return null

  // Check Authorization: ApiKey <key> (HappyRobot platform)
  const auth = request.headers.get("authorization")
  if (auth) {
    const match = auth.match(/^ApiKey\s+(.+)$/i)
    if (match && match[1] === process.env.API_KEY) return null
  }

  // Check Basic Auth (dashboard browser session — already validated by middleware)
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6))
    const [user, pass] = decoded.split(":")
    const expectedPassword = process.env.DASHBOARD_PASSWORD
    if (expectedPassword && user === "admin" && pass === expectedPassword) return null
    if (!expectedPassword) return null // no password = open access
  }

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}
