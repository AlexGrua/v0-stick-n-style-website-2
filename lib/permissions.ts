import type { Role, Permission } from "@/types/auth"

// Функции для работы с разрешениями (серверные)
export function getDefaultPermissionsForRole(role: Role): Permission[] {
  switch (role) {
    case "superadmin":
      return [
        // Все разрешения
        "products.create", "products.edit", "products.delete", "products.view",
        "orders.create", "orders.edit", "orders.delete", "orders.view",
        "users.create", "users.edit", "users.delete", "users.view",
        "settings.edit", "settings.view",
        "pages.create", "pages.edit", "pages.delete", "pages.view",
        "categories.create", "categories.edit", "categories.delete", "categories.view",
        "suppliers.create", "suppliers.edit", "suppliers.delete", "suppliers.view",
        "attributes.create", "attributes.edit", "attributes.delete", "attributes.view",
        "containers.create", "containers.edit", "containers.delete", "containers.view",
        "translations.edit", "translations.view",
        "dashboard.view",
        "clients.create", "clients.edit", "clients.delete", "clients.view"
      ]
    case "admin":
      return [
        // Все кроме управления пользователями
        "products.create", "products.edit", "products.delete", "products.view",
        "orders.create", "orders.edit", "orders.delete", "orders.view",
        "settings.edit", "settings.view",
        "pages.create", "pages.edit", "pages.delete", "pages.view",
        "categories.create", "categories.edit", "categories.delete", "categories.view",
        "suppliers.create", "suppliers.edit", "suppliers.delete", "suppliers.view",
        "attributes.create", "attributes.edit", "attributes.delete", "attributes.view",
        "containers.create", "containers.edit", "containers.delete", "containers.view",
        "translations.edit", "translations.view",
        "dashboard.view",
        "clients.create", "clients.edit", "clients.delete", "clients.view"
      ]
    case "staff":
      return [
        // Только просмотр и заказы
        "dashboard.view",
        "orders.view", "orders.edit"
      ]
  }
}

export function hasPermission(user: { role?: string; permissions?: Permission[] } | null, permission: Permission): boolean {
  if (!user) return false
  if (user.role === "superadmin") return true // superadmin имеет все права
  return user.permissions?.includes(permission) || false
}

export function hasAnyPermission(user: { role?: string; permissions?: Permission[] } | null, permissions: Permission[]): boolean {
  if (!user) return false
  if (user.role === "superadmin") return true
  return permissions.some(permission => user.permissions?.includes(permission) || false)
}

// Получить все доступные разрешения
export function getAllPermissions(): { category: string; permissions: Permission[] }[] {
  return [
    {
      category: "Products",
      permissions: ["products.create", "products.edit", "products.delete", "products.view"]
    },
    {
      category: "Orders", 
      permissions: ["orders.create", "orders.edit", "orders.delete", "orders.view"]
    },
    {
      category: "Users",
      permissions: ["users.create", "users.edit", "users.delete", "users.view"]
    },
    {
      category: "Settings",
      permissions: ["settings.edit", "settings.view"]
    },
    {
      category: "Pages",
      permissions: ["pages.create", "pages.edit", "pages.delete", "pages.view"]
    },
    {
      category: "Categories",
      permissions: ["categories.create", "categories.edit", "categories.delete", "categories.view"]
    },
    {
      category: "Suppliers",
      permissions: ["suppliers.create", "suppliers.edit", "suppliers.delete", "suppliers.view"]
    },
    {
      category: "Attributes",
      permissions: ["attributes.create", "attributes.edit", "attributes.delete", "attributes.view"]
    },
    {
      category: "Containers",
      permissions: ["containers.create", "containers.edit", "containers.delete", "containers.view"]
    },
    {
      category: "Translations",
      permissions: ["translations.edit", "translations.view"]
    },
    {
      category: "Dashboard",
      permissions: ["dashboard.view"]
    },
    {
      category: "Clients",
      permissions: ["clients.create", "clients.edit", "clients.delete", "clients.view"]
    }
  ]
}

