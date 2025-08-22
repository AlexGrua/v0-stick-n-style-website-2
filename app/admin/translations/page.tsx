"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminShell } from "@/components/admin/admin-shell"

type Lang = "en" | "ru" | "es" | "cn"

type UiTranslations = Record<string, Record<Lang, { value: string; status?: "machine" | "reviewed" }>>

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<UiTranslations>({})
  const [langs, setLangs] = useState<Lang[]>(["en", "ru", "es", "cn"]) // TODO: wire to /api/languages
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/translations/ui", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        setTranslations(data?.data?.translations || {})
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const keys = Object.keys(translations).filter((k) => (filter ? k.toLowerCase().includes(filter.toLowerCase()) : true))

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/translations/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations }),
      })
      if (!res.ok) throw new Error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Translations</h1>
            <p className="text-sm text-muted-foreground">UI keys editor (minimal)</p>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Filter keys…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-60" />
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">UI Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : keys.length === 0 ? (
              <div className="text-sm text-muted-foreground">No keys</div>
            ) : (
              <div className="grid gap-4">
                {keys.map((key) => (
                  <div key={key} className="rounded border p-3">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">{key}</div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {langs.map((lang) => (
                        <div key={lang} className="grid gap-1">
                          <Label className="text-xs">{lang.toUpperCase()}</Label>
                          <Input
                            value={translations[key]?.[lang]?.value || ""}
                            onChange={(e) =>
                              setTranslations((t) => ({
                                ...t,
                                [key]: {
                                  ...(t[key] || ({} as any)),
                                  [lang]: { value: e.target.value, status: t[key]?.[lang]?.status || "reviewed" },
                                },
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}