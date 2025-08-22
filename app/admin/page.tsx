"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatsData = { total: number; active: number; inactive: number; discontinued: number }

async function fetchStats(): Promise<StatsData> {
  const res = await fetch("/api/products/stats")
  if (!res.ok) throw new Error("Failed to load stats")
  return await res.json()
}

export default function Page() {
  const [data, setData] = useState<StatsData | null>(null)

  useEffect(() => {
    fetchStats().then(setData).catch(console.error)
  }, [])

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Products</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data ? data.total : "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data ? data.active : "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Inactive</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data ? data.inactive : "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Discontinued</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data ? data.discontinued : "—"}</CardContent>
        </Card>
      </div>
    </div>
  )
}
