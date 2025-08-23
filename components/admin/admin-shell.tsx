"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Layers,
  Settings2,
  Home,
  Tags,
  Boxes,
  LayoutGrid,
  Users,
  Receipt,
  FileText,
  Truck,
  Database,
  Navigation,
  Search,
  Languages,
  LogOut,
  Shield,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { hasPermission } from "@/lib/permissions"
import type { Permission } from "@/types/auth"

type NavItem = { href: string; label: string; icon?: React.ComponentType<any>; requiredPermission?: Permission; superadminOnly?: boolean }
type NavGroup = { label: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ href: "/admin", label: "Overview", icon: Home, requiredPermission: "dashboard.view" }],
  },
  {
    label: "Content Management",
    items: [
      { href: "/admin/catalog", label: "Products", icon: LayoutGrid, requiredPermission: "products.view" },
      { href: "/admin/categories", label: "Categories", icon: Layers, requiredPermission: "categories.view" },
      { href: "/admin/supply/suppliers", label: "Suppliers", icon: Truck, requiredPermission: "suppliers.view" },
      { href: "/admin/orders", label: "Orders", icon: Receipt, requiredPermission: "orders.view" },
    ],
  },
  {
    label: "Pages Management",
    items: [
      { href: "/admin/pages/home", label: "Home Page", icon: Home, requiredPermission: "pages.view" },
      { href: "/admin/pages/catalog", label: "Catalog Page", icon: LayoutGrid, requiredPermission: "pages.view" },
      { href: "/admin/pages/about", label: "About Us Page", icon: FileText, requiredPermission: "pages.view" },
      { href: "/admin/pages/contact", label: "Contact Page", icon: FileText, requiredPermission: "pages.view" },
      { href: "/admin/pages/faqs", label: "FAQs Page", icon: FileText, requiredPermission: "pages.view" },
      { href: "/admin/pages/create-order", label: "Create'N'Order Page", icon: FileText, requiredPermission: "pages.view" },
    ],
  },
  {
    label: "Site Settings",
    items: [
      { href: "/admin/settings/navigation", label: "Navigation", icon: Navigation, requiredPermission: "settings.view" },
      { href: "/admin/settings/languages", label: "Languages", icon: Languages, requiredPermission: "settings.view" },
      { href: "/admin/pages/footer", label: "Footer", icon: FileText, requiredPermission: "pages.view" },
      { href: "/admin/settings/seo", label: "SEO Settings", icon: Search, requiredPermission: "settings.view" },
      { href: "/admin/settings", label: "General Settings", icon: Settings2, requiredPermission: "settings.view" },
    ],
  },
  {
    label: "Localization",
    items: [
      { href: "/admin/translations", label: "Translations", icon: FileText, requiredPermission: "translations.view" },
      { href: "/admin/translations/content", label: "Content Translations", icon: FileText, requiredPermission: "translations.view" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, requiredPermission: "users.view" },
      { href: "/admin/clients", label: "Clients", icon: Users, requiredPermission: "clients.view" },
      { href: "/admin/attributes", label: "Attributes", icon: Tags, requiredPermission: "attributes.view" },
      { href: "/admin/containers", label: "Containers", icon: Boxes, requiredPermission: "containers.view" },
      { href: "/admin/database", label: "Database", icon: Database, requiredPermission: "settings.view" },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: Shield, superadminOnly: true },
    ],
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  function filterByPermissions(all: NavGroup[]): NavGroup[] {
    return all.map((group) => ({
      label: group.label,
      items: group.items.filter((item) => {
        // Superadmin only items
        if (item.superadminOnly && user?.role !== 'superadmin') return false
        
        // Permission-based items
        if (item.requiredPermission) {
          return hasPermission(user, item.requiredPermission)
        }
        
        return true
      })
    })).filter((group) => group.items.length > 0)
  }

  const visibleGroups = filterByPermissions(groups)

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[256px_1fr]">
      <aside className="hidden border-r lg:block">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Create&apos;N&apos;Order Admin</div>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-64px)] pr-1">
          <nav className="grid gap-6 pb-6">
            {visibleGroups.map((g) => (
              <div key={g.label} className="px-3">
                <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {g.label}
                </div>
                <div className="grid gap-1">
                  {g.items.map((item) => {
                    const active = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted",
                          active && "bg-muted font-medium",
                        )}
                      >
                        {Icon ? <Icon className="h-4 w-4" /> : null}
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  )
}
