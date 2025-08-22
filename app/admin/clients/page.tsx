"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClientsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Clients</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Client management (list, search, view, edit) will appear here.
        </CardContent>
      </Card>
    </div>
  )
}
