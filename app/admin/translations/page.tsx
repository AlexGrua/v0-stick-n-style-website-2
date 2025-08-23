"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Lang = "en" | "ru" | "es" | "cn"

type UiTranslations = Record<string, Record<Lang, { value: string; status?: "machine" | "reviewed" }>>

export default function TranslationsPage() {
  const [translations, setTranslations] = useState<UiTranslations>({})
  const [langs, setLangs] = useState<Lang[]>(["en", "ru", "es", "cn"]) // TODO: wire to /api/languages
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("")
  const [newKey, setNewKey] = useState("")

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

  async function autoTranslateMissing() {
    try {
      // You can limit languages here; for now use all except en
      const to = langs.filter((l) => l !== "en")
      const res = await fetch("/api/translations/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      })
      if (!res.ok) throw new Error("Auto-translate failed")
      // Reload
      const reload = await fetch(`/api/translations/ui?ts=${Date.now()}`, { cache: "no-store" })
      const data = await reload.json()
      setTranslations(data?.data?.translations || {})
    } catch (e) {
      console.error(e)
    }
  }

  function addKey(k?: string) {
    const key = (k ?? newKey).trim()
    if (!key) return
    if (translations[key]) return
    const entry: Record<Lang, { value: string; status: "reviewed" }> = langs.reduce((acc, l) => {
      acc[l] = { value: "", status: "reviewed" }
      return acc
    }, {} as any)
    setTranslations((t) => ({ ...t, [key]: entry }))
    if (!k) setNewKey("")
  }

  function quickAddHeaderKeys() {
    const list = [
      "nav.home",
      "nav.about",
      "nav.catalog",
      "nav.faqs",
      "nav.contact",
      "cta.create_order",
    ]
    list.forEach((k) => {
      if (!translations[k]) addKey(k)
    })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Translations</h1>
          <p className="text-sm text-muted-foreground">UI keys editor (minimal)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Filter keys…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-60" />
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="New key (e.g. nav.home)" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="w-60" />
        <Button variant="outline" onClick={() => addKey()}>Add key</Button>
        <Button variant="outline" onClick={quickAddHeaderKeys}>Quick add header keys</Button>
        <Button onClick={autoTranslateMissing}>Auto-translate missing</Button>
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
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4">
                    {langs.map((lang) => (
                      <div key={lang} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                        <Label className="text-[11px] text-muted-foreground whitespace-nowrap">{lang.toUpperCase()}</Label>
                        <Input
                          className="h-8 text-xs"
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
  )
}
