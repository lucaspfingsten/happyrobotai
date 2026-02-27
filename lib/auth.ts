import { NextResponse } from "next/server"

export function validateApiKey(request: Request): NextResponse | null {
  // Check x-api-key header (dashboard, direct calls)
  const xApiKey = request.headers.get("x-api-key")
  if (xApiKey && xApiKey === process.env.API_KEY) return null

  // Check Authorization: ApiKey <key> (HappyRobot platform)
  const auth = request.headers.get("authorization")
  if (auth) {
    const match = auth.match(/^ApiKey\s+(.+)$/i)
    if (match && match[1] === process.env.API_KEY) return null
  }

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}
