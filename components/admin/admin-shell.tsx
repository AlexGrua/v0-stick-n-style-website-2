"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Layers, Settings2, Home, Tags, Boxes, LayoutGrid, Users, Receipt, FileText, Truck } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

type NavItem = { href: string; label: string; icon?: React.ComponentType<any> }
type NavGroup = { label: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ href: "/admin", label: "Overview", icon: Home }],
  },
  {
    label: "Pages",
    items: [
      { href: "/admin/pages/home", label: "Home Page", icon: Home },
      { href: "/admin/pages", label: "Pages", icon: FileText },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/catalog", label: "Products", icon: LayoutGrid },
      { href: "/admin/categories", label: "Categories", icon: Layers },
    ],
  },
  {
    label: "Supply",
    items: [{ href: "/admin/supply/suppliers", label: "Suppliers", icon: Truck }],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/clients", label: "Clients", icon: Users },
      { href: "/admin/orders", label: "Orders", icon: Receipt },
    ],
  },
  {
    label: "Attributes",
    items: [{ href: "/admin/attributes", label: "Attributes", icon: Tags }],
  },
  {
    label: "Containers",
    items: [{ href: "/admin/containers", label: "Containers", icon: Boxes }],
  },
  {
    label: "Settings",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings2 }],
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[256px_1fr]">
      <aside className="hidden border-r lg:block">
        <div className="p-4 text-lg font-semibold">Create&apos;N&apos;Order Admin</div>
        <ScrollArea className="h-[calc(100vh-64px)] pr-1">
          <nav className="grid gap-6 pb-6">
            {groups.map((g) => (
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
