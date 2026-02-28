import { NextResponse } from "next/server"

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
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

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}
