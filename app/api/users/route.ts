import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api/guard'
import { 
  serverGetAllUsers, 
  serverCreateUser, 
  serverUpdateUserRole, 
  serverSetActive, 
  serverUpdateUserPermissions 
} from '@/lib/auth-storage-server'
import { auditLogger } from '@/lib/audit-logger'
import type { Role, Permission } from '@/types/auth'

function ok(data: any) {
  return NextResponse.json({ success: true, data })
}

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    const authResult = requireRole(request, 'superadmin')
    if (!authResult.ok) {
      return fail(authResult.message, authResult.status)
    }
    
    const users = serverGetAllUsers()
    return NextResponse.json({ users })
  } catch (error) {
    return fail('Failed to fetch users', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = requireRole(request, 'superadmin')
    if (!authResult.ok) {
      return fail(authResult.message, authResult.status)
    }

    const body = await request.json()
    const result = await serverCreateUser(body)
    
    if (result.ok) {
      // Get user ID by email for logging
      const users = serverGetAllUsers()
      const currentUser = users.find(u => u.email === authResult.user.email)
      
      // Log user creation
      await auditLogger.userCreated(
        currentUser?.id || 'unknown',
        result.user.id,
        result.user.email,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        request.headers.get('user-agent')
      )
      return NextResponse.json({ user: result.user })
    } else {
      return fail(result.error)
    }
  } catch (error) {
    console.error('Create user error:', error)
    return fail('Failed to create user', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = requireRole(request, 'superadmin')
    if (!authResult.ok) {
      return fail(authResult.message, authResult.status)
    }
    
    const body = await request.json()
    const { action, userId, ...data } = body
    
    switch (action) {
      case "updateRole":
        const roleResult = serverUpdateUserRole(userId, data.role as Role)
        if (roleResult.ok) {
          // Get user ID by email for logging
          const users = serverGetAllUsers()
          const currentUser = users.find(u => u.email === authResult.user.email)
          
          // Log role change
          await auditLogger.roleChanged(
            currentUser?.id || 'unknown',
            userId,
            data.targetUserEmail || 'Unknown',
            { before: data.oldRole, after: data.role },
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            request.headers.get('user-agent')
          )
          return ok({ message: "Role updated successfully" })
        } else {
          return fail(roleResult.error || "Failed to update role")
        }
        
      case "setActive":
        const activeResult = serverSetActive(userId, data.active as boolean)
        if (activeResult.ok) {
          // Get user ID by email for logging
          const users = serverGetAllUsers()
          const currentUser = users.find(u => u.email === authResult.user.email)
          
          // Log user status change
          await auditLogger.userUpdated(
            currentUser?.id || 'unknown',
            userId,
            data.targetUserEmail || 'Unknown',
            { before: { active: !data.active }, after: { active: data.active } },
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            request.headers.get('user-agent')
          )
          return ok({ message: "User status updated successfully" })
        } else {
          return fail(activeResult.error || "Failed to update user status")
        }
        
      case "updatePermissions":
        const permResult = serverUpdateUserPermissions(userId, data.permissions as Permission[])
        if (permResult.ok) {
          // Get user ID by email for logging
          const users = serverGetAllUsers()
          const currentUser = users.find(u => u.email === authResult.user.email)
          
          // Log permissions change
          await auditLogger.permissionsChanged(
            currentUser?.id || 'unknown',
            userId,
            data.targetUserEmail || 'Unknown',
            { before: data.oldPermissions, after: data.permissions },
            request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            request.headers.get('user-agent')
          )
          return ok({ message: "Permissions updated successfully" })
        } else {
          return fail(permResult.error || "Failed to update permissions")
        }
        
      default:
        return fail("Invalid action")
    }
  } catch (error) {
    console.error('Update user error:', error)
    return fail('Failed to update user', 500)
  }
}
