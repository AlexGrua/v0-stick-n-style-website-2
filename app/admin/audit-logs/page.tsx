"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AuditLog {
  id: string
  userId: string
  userRole: string
  userEmail: string
  action: string
  entity: string
  entityId?: string
  entityName?: string
  timestamp: string
  success: boolean
  error?: string
  details?: string
}

export default function AuditLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/audit-logs?limit=100')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        toast({ title: "Error", description: "Failed to fetch audit logs", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch audit logs", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }



  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Success', 'Details'].join(','),
      ...logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.userEmail,
        log.userRole,
        log.action,
        log.entity,
        log.success ? 'Yes' : 'No',
        log.details || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <main className="p-4 xl:px-[50px]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">System activity and user actions</p>
          </div>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="text-left text-sm bg-gray-50">
                <tr className="[&>th]:px-4 [&>th]:py-3">
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="border-t [&>td]:px-4 [&>td]:py-3">
                    <td className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">{log.userEmail}</div>
                        <div className="text-xs text-muted-foreground">{log.userRole}</div>
                      </div>
                    </td>
                    <td>
                      <Badge className="bg-blue-100 text-blue-800">
                        {log.action}
                      </Badge>
                    </td>
                    <td>
                      <Badge className="bg-green-100 text-green-800">
                        {log.entity}
                      </Badge>
                    </td>
                    <td className="max-w-xs">
                      <div className="truncate">
                        {log.details || `${log.action} ${log.entity}`}
                      </div>
                    </td>
                    <td>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.success ? "Success" : "Failed"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && !loading && (
              <div className="p-8 text-center text-muted-foreground">
                No audit logs found
              </div>
            )}
            {loading && (
              <div className="p-8 text-center text-muted-foreground">
                Loading audit logs...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
