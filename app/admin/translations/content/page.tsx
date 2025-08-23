"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Keep languages aligned with the rest of the app
type Lang = "en" | "ru" | "es" | "cn"

type FieldKey = "name" | "description"

type ContentTranslations = Record<string, Record<Lang, { value: string; status?: "machine" | "reviewed" }>>

type Product = { id: string; name: string; description?: string; sku?: string }
type PageBase = { id: string; title: string; content?: string; seoTitle?: string; seoDescription?: string }

export default function ContentTranslationsPage() {
  const [entityType, setEntityType] = useState<string>("product")
  const [entityId, setEntityId] = useState<string>("")
  const [base, setBase] = useState<Record<FieldKey, string>>({ name: "", description: "" })
  const [translations, setTranslations] = useState<ContentTranslations>({})
  const [langs] = useState<Lang[]>(["en", "ru", "es", "cn"]) // would be wired to settings later
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const [showResults, setShowResults] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const searchBoxRef = useRef<HTMLDivElement | null>(null)

  // Track English snapshot to detect changes
  const [baseSnapshot, setBaseSnapshot] = useState<Record<FieldKey, string>>({ name: "", description: "" })

  const fields: FieldKey[] = useMemo(() => {
    if (entityType === "product") return ["name", "description"]
    if (entityType === "page") return ["name", "description"]
    return ["name", "description"]
  }, [entityType])

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim()
      if (!q) {
        setResults([])
        setShowResults(false)
        setActiveIndex(-1)
        return
      }
      setSearching(true)
      try {
        const params = new URLSearchParams()
        params.set("q", q)
        params.set("includeInactive", "true")
        const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          const items = (data?.items || []) as Product[]
          setResults(items)
          setShowResults(items.length > 0)
          setActiveIndex(items.length > 0 ? 0 : -1)
        } else {
          setResults([])
          setShowResults(false)
          setActiveIndex(-1)
        }
      } catch {
        setResults([])
        setShowResults(false)
        setActiveIndex(-1)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchBoxRef.current) return
      if (!searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  function pickProduct(p: Product) {
    setEntityType("product")
    setEntityId(String(p.id))
    setShowResults(false)
    setQuery(p.sku ? `${p.sku} — ${p.name}` : p.name)
  }

  async function loadData() {
    if (!entityType || !entityId) return
    setLoading(true)
    try {
      // Load baseline English for known entity types
      if (entityType === "product") {
        const res = await fetch(`/api/products/${encodeURIComponent(entityId)}`, { cache: "no-store" })
        if (res.ok) {
          const p: Product = await res.json()
          setBase({ name: p?.name || "", description: p?.description || "" })
          setBaseSnapshot({ name: p?.name || "", description: p?.description || "" })
        } else {
          setBase({ name: "", description: "" })
          setBaseSnapshot({ name: "", description: "" })
        }
      } else if (entityType === "page") {
        // Fetch pages list and find by id
        const res = await fetch(`/api/pages`, { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          const page: PageBase | undefined = (data?.items || []).find((p: any) => String(p.id) === String(entityId))
          const name = page?.title || String(entityId)
          const description = page?.content || page?.seoDescription || ""
          setBase({ name, description })
          setBaseSnapshot({ name, description })
        } else {
          setBase({ name: String(entityId), description: "" })
          setBaseSnapshot({ name: String(entityId), description: "" })
        }
      } else {
        setBase({ name: "", description: "" })
        setBaseSnapshot({ name: "", description: "" })
      }

      // Load saved content translations for this entity
      const tx = await fetch(
        `/api/translations/content?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
        { cache: "no-store" },
      )
      if (tx.ok) {
        const data = await tx.json()
        const incoming = (data?.data?.translations || {}) as ContentTranslations
        setTranslations(incoming)
      } else {
        setTranslations({})
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Do not auto-load until the user enters an ID
  }, [])

  async function save() {
    if (!entityType || !entityId) return
    setSaving(true)
    try {
      // Exclude English from saves (English is canonical domain content)
      const entries: ContentTranslations = {}
      for (const path of Object.keys(translations)) {
        const langsForPath = translations[path]
        const cleaned: Record<string, { value: string; status?: "machine" | "reviewed" }> = {}
        Object.entries(langsForPath).forEach(([lang, obj]) => {
          if (lang !== "en") cleaned[lang] = { value: obj?.value || "", status: obj?.status || "reviewed" }
        })
        entries[path] = cleaned as any
      }

      const res = await fetch(`/api/translations/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, entries }),
      })
      if (!res.ok) throw new Error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function autoTranslateMissing() {
    if (!entityType || !entityId) return
    try {
      // Prepare the base English map for fields we can translate
      const fieldsMap: Record<string, string> = {}
      fields.forEach((f) => {
        const v = base[f]
        if (typeof v === "string" && v.trim().length > 0) fieldsMap[f] = v
      })
      const to = langs.filter((l) => l !== "en")

      const res = await fetch(`/api/translations/content/auto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, fields: fieldsMap, to }),
      })
      if (!res.ok) throw new Error("Auto-translate failed")
      await loadData()
    } catch (e) {
      console.error(e)
    }
  }

  async function retranslateChanged() {
    if (!entityType || !entityId) return
    try {
      // Only send fields where English changed compared to snapshot
      const changed: Record<string, string> = {}
      Object.keys(base).forEach((k) => {
        const key = k as FieldKey
        if ((base[key] || "") !== (baseSnapshot[key] || "")) {
          const v = base[key]
          if (v && v.trim().length > 0) changed[key] = v
        }
      })
      if (Object.keys(changed).length === 0) return
      const to = langs.filter((l) => l !== "en")
      const res = await fetch(`/api/translations/content/auto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, fields: changed, to }),
      })
      if (!res.ok) throw new Error("Re-translate failed")
      await loadData()
      setBaseSnapshot({ ...base })
    } catch (e) {
      console.error(e)
    }
  }

  function setValue(path: string, lang: Lang, value: string) {
    setTranslations((t) => ({
      ...t,
      [path]: {
        ...(t[path] || ({} as any)),
        [lang]: { value, status: lang === "en" ? "reviewed" : t[path]?.[lang]?.status || "reviewed" },
      },
    }))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Content Translations</h1>
          <p className="text-sm text-muted-foreground">Translate content fields per entity</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={saving || !entityType || !entityId}>{saving ? "Saving…" : "Save"}</Button>
          <Button variant="outline" onClick={retranslateChanged} disabled={!entityType || !entityId}>
            Re-translate changed
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select entity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[200px_200px_1fr]">
          <div className="grid gap-2">
            <Label>Entity Type</Label>
            <select
              className="h-9 rounded-md border px-3 text-sm"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="product">Product</option>
              <option value="page">Page</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Entity ID</Label>
            <Input placeholder="e.g. 36" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
          </div>
          {entityType === "page" ? (
            <div className="grid gap-2">
              <Label>Page presets</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "home", label: "Home" },
                  { id: "about", label: "About" },
                  { id: "faqs", label: "FAQs" },
                  { id: "contact", label: "Contact" },
                ].map((p) => (
                  <Button key={p.id} type="button" variant="outline" onClick={() => setEntityId(p.id)}>
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-2" ref={searchBoxRef}>
              <Label>Search by SKU / Name</Label>
              <div className="relative">
                <Input
                  placeholder="Type SKU or product name…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault()
                      if (results.length > 0) {
                        setShowResults(true)
                        setActiveIndex((i) => (i + 1) % results.length)
                      }
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault()
                      if (results.length > 0) {
                        setShowResults(true)
                        setActiveIndex((i) => (i - 1 + results.length) % results.length)
                      }
                    } else if (e.key === "Enter") {
                      if (showResults && results.length > 0) {
                        e.preventDefault()
                        const pick = activeIndex >= 0 ? results[activeIndex] : results[0]
                        pickProduct(pick)
                      } else if (entityId) {
                        // Enter triggers load when a specific ID is set
                        loadData()
                      }
                    } else if (e.key === "Escape") {
                      setShowResults(false)
                    }
                  }}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                />
                {showResults && (
                  <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded border bg-white shadow">
                    {results.map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => pickProduct(p)}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted ${idx === activeIndex ? "bg-muted" : ""}`}
                      >
                        <span className="truncate text-sm">{p.name}</span>
                        <span className="ml-2 shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">{p.sku || ""}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!showResults && query.trim().length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {searching ? "Searching…" : results.length === 0 ? "No results" : null}
                </div>
              )}
            </div>
          )}
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={loadData} disabled={!entityType || !entityId}>
              Load
            </Button>
            <Button onClick={autoTranslateMissing} disabled={!entityType || !entityId}>Auto-translate missing</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fields</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {fields.map((path) => (
              <div key={path} className="rounded border p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">{path}</div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-4">
                  {langs.map((lang) => (
                    <div key={lang} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                      <Label className="text-[11px] text-muted-foreground whitespace-nowrap">{lang.toUpperCase()}</Label>
                      {lang === "en" ? (
                        path === "description" ? (
                          <Textarea
                            className="text-xs"
                            value={base[path] || ""}
                            readOnly
                            title="English is the canonical content. Edit in the main entity editor."
                          />
                        ) : (
                          <Input
                            className="h-8 text-xs"
                            value={base[path] || ""}
                            readOnly
                            title="English is the canonical content. Edit in the main entity editor."
                          />
                        )
                      ) : path === "description" ? (
                        <Textarea
                          className="text-xs"
                          value={translations[path]?.[lang]?.value || ""}
                          onChange={(e) => setValue(path, lang, e.target.value)}
                        />
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          value={translations[path]?.[lang]?.value || ""}
                          onChange={(e) => setValue(path, lang, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
