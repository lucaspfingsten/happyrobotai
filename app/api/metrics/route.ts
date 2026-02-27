import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    // Call metrics
    const [
      totalCalls,
      callsToday,
      callsYesterday,
      endedCalls,
      outcomeBreakdown,
    ] = await Promise.all([
      prisma.call.count(),
      prisma.call.count({
        where: { startedAt: { gte: todayStart } },
      }),
      prisma.call.count({
        where: {
          startedAt: { gte: yesterdayStart, lt: todayStart },
        },
      }),
      prisma.call.findMany({
        where: { status: "ended", durationSeconds: { not: null } },
        select: { durationSeconds: true },
      }),
      prisma.call.groupBy({
        by: ["outcome"],
        where: { status: "ended" },
        _count: { outcome: true },
      }),
    ])

    const avgDuration =
      endedCalls.length > 0
        ? Math.round(
            endedCalls.reduce((sum, c) => sum + (c.durationSeconds ?? 0), 0) /
              endedCalls.length
          )
        : 0

    const outcomes = outcomeBreakdown.map((o) => ({
      outcome: o.outcome ?? "unknown",
      count: o._count.outcome,
    }))

    // Daily calls for trend chart (last 30 days)
    const thirtyDaysAgo = new Date(todayStart)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

    const dailyCalls = await prisma.call.findMany({
      where: { startedAt: { gte: thirtyDaysAgo } },
      select: { startedAt: true },
    })

    // Group by date string
    const dailyCountsMap: Record<string, number> = {}
    for (let d = new Date(thirtyDaysAgo); d <= todayStart; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      dailyCountsMap[key] = 0
    }
    for (const call of dailyCalls) {
      const key = call.startedAt.toISOString().slice(0, 10)
      if (dailyCountsMap[key] !== undefined) {
        dailyCountsMap[key]++
      }
    }

    const callsPerDay = Object.entries(dailyCountsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))

    // Sentiment and stages metrics
    const [sentimentBreakdown, callsWithStages] = await Promise.all([
      prisma.call.groupBy({
        by: ["sentiment"],
        where: { sentiment: { not: null } },
        _count: { sentiment: true },
      }),
      prisma.call.findMany({
        where: { stagesReached: { not: null } },
        select: { stagesReached: true },
      }),
    ])

    const sentiments = sentimentBreakdown.map((s) => ({
      sentiment: s.sentiment ?? "unknown",
      count: s._count.sentiment,
    }))

    const stagesTotal = callsWithStages.length
    const stagesCounts = {
      verified_mcnumber: 0,
      load_searched: 0,
      offer_negotiated: 0,
      call_transferred: 0,
    }
    for (const call of callsWithStages) {
      const stages = call.stagesReached as Record<string, boolean> | null
      if (!stages) continue
      if (stages.verified_mcnumber) stagesCounts.verified_mcnumber++
      if (stages.load_searched) stagesCounts.load_searched++
      if (stages.offer_negotiated) stagesCounts.offer_negotiated++
      if (stages.call_transferred) stagesCounts.call_transferred++
    }

    // Load metrics
    const [totalLoads, loadsByEquipmentType, totalSearches, searchesToday] =
      await Promise.all([
        prisma.load.count(),
        prisma.load.groupBy({
          by: ["equipmentType"],
          _count: { equipmentType: true },
        }),
        prisma.loadSearch.count(),
        prisma.loadSearch.count({
          where: { createdAt: { gte: todayStart } },
        }),
      ])

    const equipmentCounts = loadsByEquipmentType.map((e) => ({
      equipmentType: e.equipmentType,
      count: e._count.equipmentType,
    }))

    return NextResponse.json({
      calls: {
        total: totalCalls,
        today: callsToday,
        yesterday: callsYesterday,
        avgDurationSeconds: avgDuration,
        outcomes,
        perDay: callsPerDay,
        sentiments,
        stages: {
          total: stagesTotal,
          ...stagesCounts,
        },
      },
      loads: {
        total: totalLoads,
        byEquipmentType: equipmentCounts,
        searches: {
          total: totalSearches,
          today: searchesToday,
        },
      },
    })
  } catch (error) {
    console.error("[GET /api/metrics] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
