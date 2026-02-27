"use client"

import { useEffect, useState, useCallback } from "react"
import { CallsMetrics } from "@/components/calls-metrics"
import { CallsChart } from "@/components/calls-chart"
import { CallInsights } from "@/components/call-insights"
import { LoadsMetrics } from "@/components/loads-metrics"

interface MetricsData {
  calls: {
    total: number
    today: number
    yesterday: number
    avgDurationSeconds: number
    outcomes: { outcome: string; count: number }[]
    perDay: { date: string; count: number }[]
    sentiments: { sentiment: string; count: number }[]
    stages: {
      total: number
      verified_mcnumber: number
      load_searched: number
      offer_negotiated: number
      call_transferred: number
    }
  }
  loads: {
    total: number
    byEquipmentType: { equipmentType: string; count: number }[]
    searches: {
      total: number
      today: number
    }
  }
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics", {
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
      })
      if (!res.ok) throw new Error("Failed to fetch metrics")
      const data = await res.json()
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics")
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Call and load metrics overview
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        <CallsMetrics data={metrics?.calls ?? null} />
        <CallsChart data={metrics?.calls?.perDay ?? null} />
        <CallInsights
          sentiments={metrics?.calls?.sentiments ?? null}
          stages={metrics?.calls?.stages ?? null}
        />
        <LoadsMetrics data={metrics?.loads ?? null} />
      </div>
    </div>
  )
}
