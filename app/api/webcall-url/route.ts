import { NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  return NextResponse.json({ url: process.env.WEBCALL_URL || "" })
}
