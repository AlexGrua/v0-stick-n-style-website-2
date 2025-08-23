import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api/guard'
import { serverDeleteUser, serverGetAllUsers } from '@/lib/auth-storage-server'
import { auditLogger } from '@/lib/audit-logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only superadmin can delete users
    const authResult = requireRole(request, 'superadmin')
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.message }, { status: authResult.status })
    }

    const userId = params.id
    const result = serverDeleteUser(userId)
    
    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Failed to delete user' }, { status: 400 })
    }
    
    // Get user ID by email for logging
    const users = serverGetAllUsers()
    const currentUser = users.find(u => u.email === authResult.user.email)
    
    // Log user deletion
    await auditLogger.userDeleted(
      currentUser?.id || 'unknown',
      userId,
      result.deletedUserEmail || 'Unknown',
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      request.headers.get('user-agent')
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
