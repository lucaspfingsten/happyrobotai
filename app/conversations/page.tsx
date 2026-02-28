"use client"

import { Fragment, useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react"

interface StagesReached {
  verified_mcnumber: boolean
  load_searched: boolean
  offer_negotiated: boolean
  call_transferred: boolean
}

interface CallRecord {
  id: string
  callId: string
  status: string
  outcome: string | null
  durationSeconds: number | null
  carrierName: string | null
  startedAt: string
  endedAt: string | null
  summary: string | null
  sentiment: string | null
  negotiatedRate: number | null
  stagesReached: StagesReached | null
  metadata: {
    org?: { name: string }
    use_case?: { name: string; version: string }
  } | null
  createdAt: string
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—"
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function formatDatetime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "ended" ? "secondary" : "default"}>
      {status}
    </Badge>
  )
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-muted-foreground">—</span>
  const variant =
    outcome === "completed" ? "default" : "destructive"
  return <Badge variant={variant}>{outcome}</Badge>
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return <span className="text-muted-foreground">—</span>
  const variant =
    sentiment === "positive"
      ? "default"
      : sentiment === "negative"
        ? "destructive"
        : "secondary"
  return <Badge variant={variant}>{sentiment}</Badge>
}

function StageIndicator({ label, reached }: { label: string; reached: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {reached ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground/40" />
      )}
      <span className={reached ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  )
}

function ExpandedRow({ call }: { call: CallRecord }) {
  return (
    <TableRow>
      <TableCell colSpan={7} className="bg-muted/30 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {call.summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Call Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{call.summary}</p>
                {call.negotiatedRate != null && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-medium">Negotiated Rate:</span>
                    <Badge variant="secondary">${call.negotiatedRate.toLocaleString()}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {call.stagesReached && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Stages Reached</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <StageIndicator label="MC Verified" reached={call.stagesReached.verified_mcnumber} />
                  <StageIndicator label="Loads Searched" reached={call.stagesReached.load_searched} />
                  <StageIndicator label="Offer Negotiated" reached={call.stagesReached.offer_negotiated} />
                  <StageIndicator label="Call Transferred" reached={call.stagesReached.call_transferred} />
                </div>
              </CardContent>
            </Card>
          )}
          {!call.summary && !call.stagesReached && (
            <p className="text-sm text-muted-foreground">
              No post-call data available yet.
            </p>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function ConversationsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch("/api/calls", {
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
      })
      if (!res.ok) throw new Error("Failed to fetch calls")
      const data = await res.json()
      setCalls(data.calls)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calls")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCalls()
    const interval = setInterval(fetchCalls, 10000)
    return () => clearInterval(interval)
  }, [fetchCalls])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Conversations</h1>
          <p className="text-sm text-muted-foreground">
            All call sessions from HappyRobot webhooks
          </p>
        </div>
        <Badge variant="outline">{calls.length} total</Badge>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No conversations yet. Calls will appear here as webhooks arrive.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <Fragment key={call.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === call.id ? null : call.id)
                      }
                    >
                      <TableCell className="w-8 px-2">
                        {expandedId === call.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={call.status} />
                      </TableCell>
                      <TableCell>
                        <OutcomeBadge outcome={call.outcome} />
                      </TableCell>
                      <TableCell>
                        <SentimentBadge sentiment={call.sentiment} />
                      </TableCell>
                      <TableCell>
                        {call.metadata?.org?.name ?? call.carrierName ?? "—"}
                      </TableCell>
                      <TableCell>{formatDatetime(call.startedAt)}</TableCell>
                      <TableCell>{formatDuration(call.durationSeconds)}</TableCell>
                    </TableRow>
                    {expandedId === call.id && (
                      <ExpandedRow call={call} />
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
