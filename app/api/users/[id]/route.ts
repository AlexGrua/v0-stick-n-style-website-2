import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api/guard'
import { serverDeleteUser } from '@/lib/auth-storage-server'

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
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
