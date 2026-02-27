"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Search, Database } from "lucide-react"

interface LoadsMetricsProps {
  data: {
    total: number
    byEquipmentType: { equipmentType: string; count: number }[]
    searches: {
      total: number
      today: number
    }
  } | null
}

export function LoadsMetrics({ data }: LoadsMetricsProps) {
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Load Metrics</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Loads</CardDescription>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total}</div>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>By Equipment Type</CardDescription>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.byEquipmentType.length === 0 ? (
              <p className="text-sm text-muted-foreground">No loads yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.byEquipmentType.map((e) => (
                  <Badge key={e.equipmentType} variant="secondary">
                    {e.equipmentType}: {e.count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Load Searches</CardDescription>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.searches.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.searches.today} searches today
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
