import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/auth"

interface HappyRobotWebhookPayload {
  specversion: string
  id: string
  source: string
  type: string
  time: string
  datacontenttype: string
  data: {
    schema_version: string
    org_id: string
    run_id: string
    session_id: string
    use_case_id: string
    version_id: string
    status: {
      previous: string
      current: string
      updated_at: string
    }
    org: { name: string }
    use_case: { name: string; version: string }
  }
}

interface PostCallSummaryPayload {
  call_summary: string
  call_sentiment: string
  negotiated_rate: string | number | null
  stages_reached: {
    verified_mcnumber: string | boolean
    load_searched: string | boolean
    offer_negotiated: string | boolean
    call_transferred: string | boolean
  }
}

function toBool(val: string | boolean): boolean {
  if (typeof val === "boolean") return val
  return val.toLowerCase() === "yes" || val.toLowerCase() === "true"
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  try {
    const body = JSON.parse(rawBody)

    // Post-call summary webhook (has call_summary, sent with auth)
    // This payload does NOT include call_id — we match it to the most recent ended call
    if (body.call_summary !== undefined) {
      // This webhook sends auth
      const authReq = new Request(request.url, { headers: request.headers })
      const authError = validateApiKey(authReq)
      if (authError) return authError

      const summary = body as PostCallSummaryPayload

      // Find the most recently ended call that doesn't have a summary yet
      const recentCall = await prisma.call.findFirst({
        where: { status: "ended", summary: null },
        orderBy: { endedAt: "desc" },
      })

      if (!recentCall) {
        return NextResponse.json(
          { error: "No matching call found" },
          { status: 404 }
        )
      }

      const stages = summary.stages_reached
      const negotiatedRate = summary.negotiated_rate != null
        ? parseFloat(String(summary.negotiated_rate))
        : null

      await prisma.call.update({
        where: { id: recentCall.id },
        data: {
          summary: summary.call_summary,
          sentiment: summary.call_sentiment,
          negotiatedRate: negotiatedRate && !isNaN(negotiatedRate) ? negotiatedRate : null,
          stagesReached: {
            verified_mcnumber: toBool(stages.verified_mcnumber),
            load_searched: toBool(stages.load_searched),
            offer_negotiated: toBool(stages.offer_negotiated),
            call_transferred: toBool(stages.call_transferred),
          },
        },
      })

      return NextResponse.json({ success: true, type: "post_call_summary" })
    }

    // CloudEvents session status webhook (no auth from HappyRobot)
    const cloudEvent = body as HappyRobotWebhookPayload

    if (!cloudEvent.data?.session_id) {
      return NextResponse.json(
        { error: "Missing session_id or call_summary" },
        { status: 400 }
      )
    }

    const sessionId = cloudEvent.data.session_id
    const currentStatus = cloudEvent.data.status.current
    const eventTime = new Date(cloudEvent.data.status.updated_at || cloudEvent.time)

    // Session started (now in-progress)
    if (currentStatus === "in-progress") {
      await prisma.call.upsert({
        where: { callId: sessionId },
        update: {
          status: "started",
          metadata: cloudEvent.data as unknown as Record<string, unknown>,
        },
        create: {
          callId: sessionId,
          status: "started",
          startedAt: eventTime,
          carrierName: cloudEvent.data.org?.name ?? null,
          metadata: cloudEvent.data as unknown as Record<string, unknown>,
        },
      })
      return NextResponse.json({ success: true, status: "started" })
    }

    // Session completed or any terminal state
    if (currentStatus === "completed" || currentStatus === "failed" || currentStatus === "cancelled") {
      const existingCall = await prisma.call.findUnique({
        where: { callId: sessionId },
      })

      const startedAt = existingCall?.startedAt ?? eventTime
      const durationSeconds = Math.round(
        (eventTime.getTime() - startedAt.getTime()) / 1000
      )

      await prisma.call.upsert({
        where: { callId: sessionId },
        update: {
          status: "ended",
          outcome: currentStatus,
          durationSeconds: durationSeconds > 0 ? durationSeconds : null,
          endedAt: eventTime,
          metadata: cloudEvent.data as unknown as Record<string, unknown>,
        },
        create: {
          callId: sessionId,
          status: "ended",
          outcome: currentStatus,
          startedAt: startedAt,
          endedAt: eventTime,
          durationSeconds: durationSeconds > 0 ? durationSeconds : null,
          carrierName: cloudEvent.data.org?.name ?? null,
          metadata: cloudEvent.data as unknown as Record<string, unknown>,
        },
      })
      return NextResponse.json({ success: true, status: "ended" })
    }

    // Any other status change (e.g. "queued") — just acknowledge
    return NextResponse.json({ success: true, status: currentStatus })
  } catch (error) {
    console.error("[POST /api/webhooks/calls] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
