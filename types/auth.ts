export type Role = "superadmin" | "admin" | "staff"

export type PublicUser = {
  id: string
  username: string
  email: string
  phone?: string
  messenger?: string
  role: Role
  createdAt: string
  updatedAt: string
  active: boolean
}

export type StoredUser = PublicUser & {
  passwordHash: string
  resetCode?: string
}
