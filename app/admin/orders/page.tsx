"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OrdersPage() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Orders</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Order management (list, statuses, export) will appear here.
        </CardContent>
      </Card>
    </div>
  )
}
