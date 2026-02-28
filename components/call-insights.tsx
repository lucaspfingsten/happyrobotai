"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SmilePlus, GitBranch, Percent } from "lucide-react"

interface CallInsightsProps {
  sentiments: { sentiment: string; count: number }[] | null
  stages: {
    total: number
    verified_mcnumber: number
    load_searched: number
    offer_negotiated: number
    call_transferred: number
  } | null
  negotiation: {
    count: number
    avgRate: number | null
    minRate: number | null
    maxRate: number | null
  } | null
}

const stageLabels: Record<string, string> = {
  verified_mcnumber: "MC Verified",
  load_searched: "Loads Searched",
  offer_negotiated: "Offer Negotiated",
  call_transferred: "Call Transferred",
}

const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-gray-100 text-gray-800",
  negative: "bg-red-100 text-red-800",
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value}/{max} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function CallInsights({ sentiments, stages, negotiation }: CallInsightsProps) {
  if (!sentiments && !stages) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-24 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Call Insights</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Sentiment Analysis</CardTitle>
              <CardDescription>How callers felt during conversations</CardDescription>
            </div>
            <SmilePlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!sentiments || sentiments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sentiment data yet</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {sentiments.map((s) => (
                  <div key={s.sentiment} className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        sentimentColors[s.sentiment] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {s.sentiment}
                    </span>
                    <span className="text-lg font-semibold">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Call Stages</CardTitle>
              <CardDescription>
                How far calls progress ({stages?.total ?? 0} calls with data)
              </CardDescription>
            </div>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!stages || stages.total === 0 ? (
              <p className="text-sm text-muted-foreground">No stage data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stageLabels).map(([key, label]) => (
                  <ProgressBar
                    key={key}
                    label={label}
                    value={stages[key as keyof typeof stageLabels] as unknown as number}
                    max={stages.total}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Negotiation Discount</CardTitle>
              <CardDescription>
                Rate reduction achieved ({negotiation?.count ?? 0} calls)
              </CardDescription>
            </div>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!negotiation || negotiation.count === 0 ? (
              <p className="text-sm text-muted-foreground">No negotiation data yet</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average</span>
                  <span className="text-2xl font-bold">
                    {negotiation.avgRate ?? "—"}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Min</span>
                  <span>{negotiation.minRate ?? "—"}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Max</span>
                  <span>{negotiation.maxRate ?? "—"}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
