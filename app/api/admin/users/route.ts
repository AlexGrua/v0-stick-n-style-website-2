import { NextResponse } from "next/server"
import { requireRole } from "@/lib/api/guard"
import { 
  serverGetAllUsers, 
  serverCreateUser, 
  serverUpdateUserRole, 
  serverSetActive, 
  serverDeleteUser,
  serverUpdateUserPermissions 
} from "@/lib/auth-storage-server"
import type { Role, Permission } from "@/types/auth"

function ok(data: any) {
  return NextResponse.json({ success: true, data })
}

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(request: Request) {
  const auth = requireRole(request, "superadmin")
  if (!auth.ok) return fail(auth.message, auth.status)
  
  const users = serverGetAllUsers()
  return ok(users)
}

export async function POST(request: Request) {
  const auth = requireRole(request, "superadmin")
  if (!auth.ok) return fail(auth.message, auth.status)
  
  try {
    const body = await request.json()
    const result = await serverCreateUser(body)
    
    if (result.ok) {
      return ok(result.user)
    } else {
      return fail(result.error)
    }
  } catch (e: any) {
    return fail(e?.message || "Failed to create user", 500)
  }
}

export async function PUT(request: Request) {
  const auth = requireRole(request, "superadmin")
  if (!auth.ok) return fail(auth.message, auth.status)
  
  try {
    const body = await request.json()
    const { action, userId, ...data } = body
    
    switch (action) {
      case "updateRole":
        const roleResult = serverUpdateUserRole(userId, data.role as Role)
        if (roleResult.ok) {
          return ok({ message: "Role updated successfully" })
        } else {
          return fail(roleResult.error || "Failed to update role")
        }
        
      case "setActive":
        const activeResult = serverSetActive(userId, data.active as boolean)
        if (activeResult.ok) {
          return ok({ message: "User status updated successfully" })
        } else {
          return fail("Failed to update user status")
        }
        
      case "updatePermissions":
        const permResult = serverUpdateUserPermissions(userId, data.permissions as Permission[])
        if (permResult.ok) {
          return ok({ message: "Permissions updated successfully" })
        } else {
          return fail(permResult.error || "Failed to update permissions")
        }
        
      default:
        return fail("Invalid action")
    }
  } catch (e: any) {
    return fail(e?.message || "Failed to update user", 500)
  }
}

export async function DELETE(request: Request) {
  const auth = requireRole(request, "superadmin")
  if (!auth.ok) return fail(auth.message, auth.status)
  
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")
    
    if (!userId) return fail("User ID is required")
    
    const result = serverDeleteUser(userId)
    if (result.ok) {
      return ok({ message: "User deleted successfully" })
    } else {
      return fail("Failed to delete user")
    }
  } catch (e: any) {
    return fail(e?.message || "Failed to delete user", 500)
  }
}

