export type Role = "superadmin" | "admin" | "staff"

// Система разрешений
export type Permission = 
  // Products
  | "products.create" | "products.edit" | "products.delete" | "products.view"
  // Orders  
  | "orders.create" | "orders.edit" | "orders.delete" | "orders.view"
  // Users
  | "users.create" | "users.edit" | "users.delete" | "users.view"
  // Settings
  | "settings.edit" | "settings.view"
  // Pages
  | "pages.create" | "pages.edit" | "pages.delete" | "pages.view"
  // Categories
  | "categories.create" | "categories.edit" | "categories.delete" | "categories.view"
  // Suppliers
  | "suppliers.create" | "suppliers.edit" | "suppliers.delete" | "suppliers.view"
  // Attributes
  | "attributes.create" | "attributes.edit" | "attributes.delete" | "attributes.view"
  // Containers
  | "containers.create" | "containers.edit" | "containers.delete" | "containers.view"
  // Translations
  | "translations.edit" | "translations.view"
  // Dashboard
  | "dashboard.view"
  // Clients
  | "clients.create" | "clients.edit" | "clients.delete" | "clients.view"

export type User = {
  id: string
  username: string
  email: string
  role: Role
  permissions: Permission[] // Новое поле для разрешений
  active: boolean
  createdAt: string
  updatedAt: string
  phone?: string
  messenger?: string
}

export type PublicUser = Omit<User, "passwordHash">

export type StoredUser = PublicUser & {
  passwordHash: string
  resetCode?: string
}
