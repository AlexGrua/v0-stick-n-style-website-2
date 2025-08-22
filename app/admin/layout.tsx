import type React from "react"
import { Providers } from "@/components/providers"
import { AdminShell } from "@/components/admin/admin-shell"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminShell>{children}</AdminShell>
    </Providers>
  )
}
