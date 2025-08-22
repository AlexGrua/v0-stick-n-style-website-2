"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

type SettingsDto = {
  companyName: string
  defaultLocale: string
  currency: string
  exportColumns: string[]
  exportLogoUrl?: string
  showLanguageSwitcher: boolean
}

async function fetchSettings() {
  const res = await fetch("/api/settings")
  if (!res.ok) throw new Error("Failed to load settings")
  return (await res.json()) as SettingsDto
}

export default function Page() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings })

  const mut = useMutation({
    mutationFn: async (payload: Partial<SettingsDto>) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Save failed")
      return (await res.json()) as SettingsDto
    },
    onSuccess: () => {
      toast({ title: "Settings saved" })
      qc.invalidateQueries({ queryKey: ["settings"] })
    },
  })

  if (!data) return <div className="p-6 text-muted-foreground">Loading…</div>

  const toggleColumn = (col: string) => {
    const set = new Set(data.exportColumns)
    if (set.has(col)) set.delete(col)
    else set.add(col)
    mut.mutate({ exportColumns: Array.from(set) })
  }

  const allColumns = [
    "sku",
    "name",
    "category",
    "sub",
    "sizes",
    "thickness",
    "pcsPerBox",
    "boxKg",
    "boxM3",
    "status",
    "thumbnailUrl",
  ]

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Company</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Company Name</Label>
            <Input defaultValue={data.companyName} onBlur={(e) => mut.mutate({ companyName: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Default Locale</Label>
            <Input defaultValue={data.defaultLocale} onBlur={(e) => mut.mutate({ defaultLocale: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Currency</Label>
            <Input defaultValue={data.currency} onBlur={(e) => mut.mutate({ currency: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Export Logo URL</Label>
            <Input defaultValue={data.exportLogoUrl} onBlur={(e) => mut.mutate({ exportLogoUrl: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Show Language Switcher</Label>
            <div className="flex items-center gap-3">
              <Switch checked={!!data.showLanguageSwitcher} onCheckedChange={(v) => mut.mutate({ showLanguageSwitcher: v })} />
              <span className="text-sm text-muted-foreground">Toggle visibility in header</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Export Template (CSV/PDF columns)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allColumns.map((c) => {
              const active = data.exportColumns.includes(c)
              return (
                <Button key={c} variant={active ? "default" : "outline"} size="sm" onClick={() => toggleColumn(c)}>
                  {c}
                </Button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Click to toggle columns included in exports.</p>
        </CardContent>
      </Card>
    </div>
  )
}
