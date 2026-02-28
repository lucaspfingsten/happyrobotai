import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {

  try {
    const calls = await prisma.call.findMany({
      orderBy: { startedAt: "desc" },
    })

    return NextResponse.json({ calls })
  } catch (error) {
    console.error("[GET /api/calls] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
