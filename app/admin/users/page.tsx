"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, User, Mail, Phone, MessageSquare, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getDefaultPermissionsForRole, getAllPermissions } from "@/lib/permissions"
import type { Permission } from "@/types/auth"

interface User {
  id: string
  username: string
  email: string
  role: 'superadmin' | 'admin' | 'staff'
  permissions: string[]
  active: boolean
  createdAt: string
  updatedAt: string
  phone?: string
  messenger?: string
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'staff' as const,
    phone: '',
    messenger: '',
    permissions: getDefaultPermissionsForRole('staff')
  })

  const allPermissions = getAllPermissions()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleRoleChange = (role: 'superadmin' | 'admin' | 'staff') => {
    const defaultPermissions = getDefaultPermissionsForRole(role)
    setNewUser({ ...newUser, role, permissions: defaultPermissions })
  }

  const togglePermission = (permission: string) => {
    const updatedPermissions = newUser.permissions.includes(permission)
      ? newUser.permissions.filter(p => p !== permission)
      : [...newUser.permissions, permission]
    setNewUser({ ...newUser, permissions: updatedPermissions })
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        toast({ title: "Success", description: "User created successfully" })
        setNewUser({ 
          username: '', 
          email: '', 
          password: '', 
          role: 'staff',
          phone: '', 
          messenger: '',
          permissions: getDefaultPermissionsForRole('staff')
        })
        setShowCreateForm(false)
        fetchUsers()
      } else {
        const error = await response.json()
        toast({ 
          title: "Error", 
          description: error.error || "Failed to create user",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to create user",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: "Success", description: "User deleted successfully" })
        fetchUsers()
      } else {
        toast({ title: "Error", description: "Failed to delete user" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user" })
    }
  }

  const updateUserRole = async (userId: string, newRole: 'superadmin' | 'admin' | 'staff') => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateRole', userId, role: newRole })
      })

      if (response.ok) {
        toast({ title: "Success", description: "Role updated successfully" })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to update role" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role" })
    }
  }

  const toggleUserActive = async (userId: string, active: boolean) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setActive', userId, active })
      })

      if (response.ok) {
        toast({ title: "Success", description: `User ${active ? 'activated' : 'deactivated'} successfully` })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to update user status" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user status" })
    }
  }

  const updateUserPermissions = async (userId: string, permissions: Permission[]) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePermissions', userId, permissions })
      })

      if (response.ok) {
        toast({ title: "Success", description: "Permissions updated successfully" })
        setShowPermissionsModal(null)
        fetchUsers()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to update permissions" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update permissions" })
    }
  }

  const resetPermissions = async (userId: string, role: 'superadmin' | 'admin' | 'staff') => {
    try {
      const permissions = getDefaultPermissionsForRole(role)
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updatePermissions', userId, permissions })
      })

      if (response.ok) {
        toast({ title: "Success", description: "Permissions reset to default" })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to reset permissions" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset permissions" })
    }
  }

  const getCurrentUser = (userId: string) => users.find(u => u.id === userId)

  return (
    <main className="p-4 xl:px-[50px]">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      {/* Create User Modal */}
      {showCreateForm && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Create New User</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>×</Button>
            </div>
                         <form onSubmit={createUser} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                   <Label htmlFor="username">Username *</Label>
                   <Input
                     id="username"
                     value={newUser.username}
                     onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                     required
                     placeholder="username"
                   />
                 </div>
                 <div>
                   <Label htmlFor="email">Email *</Label>
                   <Input
                     id="email"
                     type="email"
                     value={newUser.email}
                     onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                     required
                     placeholder="user@example.com"
                   />
                 </div>
                 <div>
                   <Label htmlFor="password">Password *</Label>
                   <Input
                     id="password"
                     type="password"
                     value={newUser.password}
                     onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                     required
                     placeholder="Min 8 chars, letters, numbers, symbols"
                   />
                 </div>
                 <div>
                   <Label htmlFor="role">Role *</Label>
                   <Select value={newUser.role} onValueChange={handleRoleChange}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="staff">Staff</SelectItem>
                       <SelectItem value="admin">Admin</SelectItem>
                       <SelectItem value="superadmin">Super Admin</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="phone">Phone</Label>
                   <Input
                     id="phone"
                     type="tel"
                     value={newUser.phone}
                     onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                     placeholder="+1234567890"
                   />
                 </div>
                 <div>
                   <Label htmlFor="messenger">Messenger</Label>
                   <Input
                     id="messenger"
                     value={newUser.messenger}
                     onChange={(e) => setNewUser({ ...newUser, messenger: e.target.value })}
                     placeholder="Telegram, WhatsApp, etc."
                   />
                 </div>
               </div>
               <p className="text-xs text-muted-foreground">
                 Password must contain letters, numbers, and special characters
               </p>

                             {/* Permissions Section */}
               <div className="border-t pt-3">
                 <div className="flex items-center justify-between mb-1">
                   <Label className="text-sm font-medium">Permissions</Label>
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={() => setNewUser({ ...newUser, permissions: getDefaultPermissionsForRole(newUser.role) })}
                   >
                     Reset to Default
                   </Button>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-52 overflow-y-auto p-2 border rounded-md bg-gray-50">
                   {allPermissions.map((category) => (
                     <div key={category.category} className="space-y-1">
                       <h4 className="text-xs font-medium text-gray-600 border-b pb-1">{category.category}</h4>
                       <div className="space-y-0.5">
                         {category.permissions.map((permission) => (
                           <div key={permission} className="flex items-center space-x-1">
                             <Checkbox
                               id={`new-${permission}`}
                               checked={newUser.permissions.includes(permission)}
                               onCheckedChange={() => togglePermission(permission)}
                               className="h-3 w-3"
                             />
                             <Label htmlFor={`new-${permission}`} className="text-xs leading-tight">
                               {permission.split('.')[1]}
                             </Label>
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create User"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

             {/* Permissions Modal */}
       {showPermissionsModal && (
         <Card className="mb-4">
           <CardContent className="p-4">
             <div className="flex items-center justify-between mb-1">
               <h2 className="text-lg font-medium">Edit Permissions - {getCurrentUser(showPermissionsModal)?.username}</h2>
               <Button variant="ghost" size="sm" onClick={() => setShowPermissionsModal(null)}>×</Button>
             </div>
             <PermissionsEditor 
               user={getCurrentUser(showPermissionsModal)!}
               onSave={(permissions) => updateUserPermissions(showPermissionsModal, permissions)}
               onReset={(role) => resetPermissions(showPermissionsModal, role)}
             />
           </CardContent>
         </Card>
       )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="text-left text-sm">
                <tr className="[&>th]:px-4 [&>th]:py-2">
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Contact</th>
                  <th>Created</th>
                  <th className="w-12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="border-t [&>td]:px-4 [&>td]:py-2">
                    <td>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-muted-foreground">{user.email}</div>
                      </div>
                    </td>
                    <td>
                      <Select 
                        value={user.role} 
                        onValueChange={(value: 'superadmin' | 'admin' | 'staff') => updateUserRole(user.id, value)}
                        disabled={user.role === 'superadmin'}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.active}
                          onCheckedChange={(checked) => toggleUserActive(user.id, checked)}
                          disabled={user.role === 'superadmin'}
                        />
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        {user.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                        {user.messenger && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {user.messenger}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShowPermissionsModal(user.id)} disabled={user.role === 'superadmin'}>
                            <Settings className="mr-2 h-4 w-4" />
                            Edit Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => resetPermissions(user.id, user.role)} disabled={user.role === 'superadmin'}>
                            Reset Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteUser(user.id)} disabled={user.role === 'superadmin'} className="text-red-600">
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">No users found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

// Permissions Editor Component
function PermissionsEditor({ user, onSave, onReset }: { 
  user: User, 
  onSave: (permissions: Permission[]) => void, 
  onReset: (role: 'superadmin' | 'admin' | 'staff') => void 
}) {
  const [permissions, setPermissions] = useState<string[]>(user.permissions)
  const allPermissions = getAllPermissions()

  const togglePermission = (permission: string) => {
    const updatedPermissions = permissions.includes(permission)
      ? permissions.filter(p => p !== permission)
      : [...permissions, permission]
    setPermissions(updatedPermissions)
  }

  const handleSave = () => {
    onSave(permissions as Permission[])
  }

  const handleReset = () => {
    onReset(user.role)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-52 overflow-y-auto p-2 border rounded-md bg-gray-50">
        {allPermissions.map((category) => (
          <div key={category.category} className="space-y-1">
            <h4 className="text-xs font-medium text-gray-600 border-b pb-1">{category.category}</h4>
            <div className="space-y-0.5">
              {category.permissions.map((permission) => (
                <div key={permission} className="flex items-center space-x-1">
                  <Checkbox
                    id={`edit-${permission}`}
                    checked={permissions.includes(permission)}
                    onCheckedChange={() => togglePermission(permission)}
                    className="h-3 w-3"
                  />
                  <Label htmlFor={`edit-${permission}`} className="text-xs leading-tight">
                    {permission.split('.')[1]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave}>Save Permissions</Button>
        <Button variant="outline" onClick={handleReset}>Reset to Default</Button>
      </div>
    </div>
  )
}
