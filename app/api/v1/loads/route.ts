import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)

    const MAX_PARAM_LENGTH = 200

    function sanitize(val: string | null): string | null {
      if (!val) return null
      if (val.length > MAX_PARAM_LENGTH) return null
      return val.trim()
    }

    const origin = sanitize(searchParams.get("origin"))
    const destination = sanitize(searchParams.get("destination"))
    const pickupDatetime = sanitize(searchParams.get("pickup_datetime"))
    const deliveryDatetime = sanitize(searchParams.get("delivery_datetime"))
    const equipmentType = sanitize(searchParams.get("equipment_type"))

    const where: Prisma.LoadWhereInput = {}

    if (origin) {
      where.origin = { contains: origin, mode: "insensitive" }
    }
    if (destination) {
      where.destination = { contains: destination, mode: "insensitive" }
    }
    if (equipmentType) {
      where.equipmentType = { contains: equipmentType, mode: "insensitive" }
    }
    if (pickupDatetime) {
      const date = new Date(pickupDatetime)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { statusCode: 400, body: { error: "Invalid pickup_datetime format" } },
          { status: 400 }
        )
      }
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      where.pickupDatetime = { gte: date, lt: nextDay }
    }
    if (deliveryDatetime) {
      const date = new Date(deliveryDatetime)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { statusCode: 400, body: { error: "Invalid delivery_datetime format" } },
          { status: 400 }
        )
      }
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      where.deliveryDatetime = { gte: date, lt: nextDay }
    }

    const loads = await prisma.load.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 3,
    })

    // Log the search for metrics
    await prisma.loadSearch.create({
      data: {
        query: Object.fromEntries(Array.from(searchParams.entries())),
        results: loads.length,
      },
    })

    return NextResponse.json({
      statusCode: 200,
      body: { loads },
    })
  } catch (error) {
    console.error("[GET /api/v1/loads] Error:", error)
    return NextResponse.json(
      { statusCode: 500, body: { error: "Internal server error" } },
      { status: 500 }
    )
  }
}
