"use client"
import { useEffect, useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import PageForm from "@/components/admin/page-form"

type PageLite = {
  id: string
  title: string
  path: string
  updatedAt: string
}

export default function PagesAdminPage() {
  const [items, setItems] = useState<PageLite[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/pages", { cache: "no-store" })
      const data = await res.json()
      setItems((data.items || []) as PageLite[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const handler = () => load()
    window.addEventListener("pages:changed", handler as any)
    return () => window.removeEventListener("pages:changed", handler as any)
  }, [])

  const rows = useMemo(() => items, [items])

  return (
    <AdminShell title="Pages">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Path</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell className="font-mono text-xs">{r.path}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => setOpenId(r.id)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No pages
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PageForm
        pageId={openId || "home"}
        open={!!openId}
        onOpenChange={(o) => {
          if (!o) setOpenId(null)
          else if (!openId) setOpenId("home")
        }}
        onSaved={() => load()}
      />
    </AdminShell>
  )
}
