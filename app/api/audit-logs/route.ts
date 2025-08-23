import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/api/guard'
import { getAuditLogs } from '@/lib/audit-logger'

function ok(data: any) {
  return Response.json(data)
}

function fail(message: string, status: number = 400) {
  return Response.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "superadmin")
  if (!auth.ok) return fail(auth.message, auth.status)
  
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') as any || undefined,
      entity: searchParams.get('entity') as any || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    }
    
    const logs = getAuditLogs(filters)
    
    return ok({ logs })
  } catch (error: any) {
    return fail(error?.message || "Failed to fetch audit logs", 500)
  }
}
