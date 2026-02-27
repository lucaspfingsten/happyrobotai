import { NextResponse } from "next/server"
import { validateApiKey } from "@/lib/auth"

export const dynamic = "force-dynamic"

const FMCSA_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services"

export async function GET(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const mcNumber = searchParams.get("mc_number")

    if (!mcNumber) {
      return NextResponse.json(
        { statusCode: 400, body: { error: "Missing required parameter: mc_number" } },
        { status: 400 }
      )
    }

    const webKey = process.env.FMCSA_WEB_KEY
    if (!webKey) {
      console.error("[GET /api/v1/carrier-verify] FMCSA_WEB_KEY not configured")
      return NextResponse.json(
        { statusCode: 500, body: { error: "FMCSA API key not configured" } },
        { status: 500 }
      )
    }

    // Strip "MC" prefix if provided (e.g. "MC-1515" or "MC1515" → "1515")
    const cleanMcNumber = mcNumber.replace(/^MC-?/i, "").trim()

    const fmcsaUrl = `${FMCSA_BASE_URL}/carriers/docket-number/${encodeURIComponent(cleanMcNumber)}?webKey=${encodeURIComponent(webKey)}`
    const fmcsaRes = await fetch(fmcsaUrl)

    if (!fmcsaRes.ok) {
      if (fmcsaRes.status === 404) {
        return NextResponse.json({
          statusCode: 200,
          body: {
            mc_number: mcNumber,
            eligible: false,
            reason: "MC number not found in FMCSA database",
          },
        })
      }
      console.error("[GET /api/v1/carrier-verify] FMCSA API error:", fmcsaRes.status)
      return NextResponse.json(
        { statusCode: 502, body: { error: "Failed to reach FMCSA API" } },
        { status: 502 }
      )
    }

    const data = await fmcsaRes.json()
    const carrier = data?.content?.[0]?.carrier

    if (!carrier) {
      return NextResponse.json({
        statusCode: 200,
        body: {
          mc_number: mcNumber,
          eligible: false,
          reason: "No carrier data found for this MC number",
        },
      })
    }

    const allowedToOperate = carrier.allowedToOperate === "Y"
    const outOfService = carrier.outOfService === "Y"
    const eligible = allowedToOperate && !outOfService

    const reasons: string[] = []
    if (!allowedToOperate) reasons.push("Carrier is not allowed to operate")
    if (outOfService) reasons.push("Carrier is out of service")

    return NextResponse.json({
      statusCode: 200,
      body: {
        mc_number: mcNumber,
        eligible,
        reason: eligible ? "Carrier is authorized and active" : reasons.join("; "),
        carrier_name: carrier.legalName || carrier.dbaName || null,
        dot_number: carrier.dotNumber || null,
      },
    })
  } catch (error) {
    console.error("[GET /api/v1/carrier-verify] Error:", error)
    return NextResponse.json(
      { statusCode: 500, body: { error: "Internal server error" } },
      { status: 500 }
    )
  }
}
