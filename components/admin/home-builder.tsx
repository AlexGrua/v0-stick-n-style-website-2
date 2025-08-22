"use client"

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUp, ArrowDown, Save, Send, Plus, Trash2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type BlockType = "hero" | "categoryGrid" | "about" | "footerCta"
type Block = {
  id: string
  type: BlockType
  position: number
  is_active: boolean
  data: any
}
type PageModel = {
  id: string
  slug: "home"
  locale: string
  status: "draft" | "published"
  meta: { title?: string; description?: string; ogImage?: string }
  draftBlocks: Block[]
  publishedBlocks: Block[]
  updatedAt: string
  publishedAt?: string
}

export default function HomeBuilder() {
  const { toast } = useToast()
  const [page, setPage] = React.useState<PageModel | null>(null)
  const [blocks, setBlocks] = React.useState<Block[]>([])
  const [dirty, setDirty] = React.useState(false)
  const [categories, setCategories] = React.useState<Array<{ id: string; name: string }>>([])

  React.useEffect(() => {
    ;(async () => {
      const [p, cats] = await Promise.all([
        fetch("/api/admin/home", { cache: "no-store" }).then((r) => r.json() as Promise<PageModel>),
        fetch("/api/categories", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : { items: [] }))
          .catch(() => ({ items: [] })) as Promise<{ items: Array<{ id: string; name: string }> }>,
      ])
      const sorted = (p.draftBlocks || []).slice().sort((a, b) => a.position - b.position)
      setPage(p)
      setBlocks(sorted)
      setCategories((cats.items || []).map((c) => ({ id: c.id, name: c.name })))
    })()
  }, [])

  function markDirty() {
    setDirty(true)
  }

  function updateBlockLocal(id: string, patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b
        const data = patch.data ? { ...b.data, ...patch.data } : b.data
        return { ...b, ...patch, data }
      }),
    )
    markDirty()
  }

  function move(id: string, dir: "up" | "down") {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx === -1) return prev
      const j = dir === "up" ? idx - 1 : idx + 1
      if (j < 0 || j >= prev.length) return prev
      const copy = prev.slice()
      const [it] = copy.splice(idx, 1)
      copy.splice(j, 0, it)
      // normalize positions
      return copy.map((b, i) => ({ ...b, position: i }))
    })
    markDirty()
  }

  async function saveAll() {
    const res = await fetch("/api/admin/home", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    })
    if (!res.ok) {
      toast({ title: "Save failed", variant: "destructive" })
      return
    }
    const p = (await res.json()) as PageModel
    setPage(p)
    setBlocks(p.draftBlocks.slice().sort((a, b) => a.position - b.position))
    setDirty(false)
    toast({ title: "Saved", description: "All changes saved" })
  }

  async function publish() {
    const res = await fetch("/api/admin/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    })
    if (!res.ok) {
      toast({ title: "Publish failed", variant: "destructive" })
      return
    }
    const p = (await res.json()) as PageModel
    setPage(p)
    toast({ title: "Published" })
  }

  function syncFirst4Categories(blockId: string) {
    const first4 = categories.slice(0, 4)
    updateBlockLocal(blockId, {
      data: {
        items: first4.map((c) => ({
          categoryId: c.id,
          title: c.name,
          href: "/catalog",
          description: "",
          image: "",
        })),
      },
    })
  }

  async function uploadToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(String(fr.result))
      fr.onerror = reject
      fr.readAsDataURL(file)
    })
  }

  if (!page) {
    return <div className="p-6 text-muted-foreground">Loading…</div>
  }

  return (
    <div className="grid gap-4 p-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={page.meta.title || ""}
              onChange={(e) => setPage({ ...page, meta: { ...page.meta, title: e.target.value } })}
              placeholder="Page title"
              className="h-8 w-56"
            />
            <Input
              value={page.meta.description || ""}
              onChange={(e) => setPage({ ...page, meta: { ...page.meta, description: e.target.value } })}
              placeholder="Meta description"
              className="h-8 w-80"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const res = await fetch("/api/admin/home", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ meta: page.meta }),
                })
                if (res.ok) toast({ title: "Meta saved" })
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Meta
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={dirty ? "default" : "outline"}
              onClick={saveAll}
              className={dirty ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={publish}>
              <Send className="mr-2 h-4 w-4" />
              Publish
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          {blocks.map((b, i) => (
            <Card key={b.id} className="border">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base capitalize">
                  {b.type} <span className="text-xs font-normal text-muted-foreground">#{b.id.slice(0, 6)}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={b.is_active}
                      onCheckedChange={(v) => updateBlockLocal(b.id, { is_active: v })}
                      id={`enabled-${b.id}`}
                    />
                    <Label htmlFor={`enabled-${b.id}`} className="text-xs">
                      Enabled
                    </Label>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => move(b.id, "up")} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => move(b.id, "down")}
                    disabled={i === blocks.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="grid gap-4">
                {/* HERO */}
                {b.type === "hero" && (
                  <div className="grid gap-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={b.data.title || ""}
                        onChange={(e) => updateBlockLocal(b.id, { data: { title: e.target.value } })}
                        placeholder="Hero title"
                        className="h-9"
                      />
                      <Input
                        value={b.data.subtitle || ""}
                        onChange={(e) => updateBlockLocal(b.id, { data: { subtitle: e.target.value } })}
                        placeholder="Hero subtitle"
                        className="h-9"
                      />
                    </div>
                    <Textarea
                      value={b.data.body || ""}
                      onChange={(e) => updateBlockLocal(b.id, { data: { body: e.target.value } })}
                      placeholder="Additional text (optional)"
                      rows={3}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={b.data.ctas?.[0]?.label || ""}
                        onChange={(e) =>
                          updateBlockLocal(b.id, {
                            data: { ctas: [{ ...(b.data.ctas?.[0] || {}), label: e.target.value }] },
                          })
                        }
                        placeholder="CTA label"
                        className="h-9"
                      />
                      <Input
                        value={b.data.ctas?.[0]?.href || ""}
                        onChange={(e) =>
                          updateBlockLocal(b.id, {
                            data: { ctas: [{ ...(b.data.ctas?.[0] || {}), href: e.target.value }] },
                          })
                        }
                        placeholder="CTA href"
                        className="h-9"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Background image URL</Label>
                      <Input
                        value={b.data.backgroundImage || ""}
                        onChange={(e) => updateBlockLocal(b.id, { data: { backgroundImage: e.target.value } })}
                        placeholder="https://..."
                        className="h-9"
                      />
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            className="h-9"
                            onChange={async (e) => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              const url = await uploadToDataUrl(f)
                              updateBlockLocal(b.id, { data: { backgroundImage: url } })
                              e.currentTarget.value = ""
                            }}
                          />
                          <span className="text-xs text-muted-foreground">or upload image</span>
                        </label>
                      </div>
                      <div className="relative mt-2 h-24 w-40 overflow-hidden rounded border">
                        <Image
                          src={b.data.backgroundImage || "/placeholder.svg?height=180&width=300&query=Hero+image"}
                          alt="Hero"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CATEGORY GRID */}
                {b.type === "categoryGrid" && (
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncFirst4Categories(b.id)}
                        title="Fill with first 4 categories"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Use first 4 categories
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateBlockLocal(b.id, {
                            data: {
                              items: [
                                ...(b.data.items || []),
                                {
                                  categoryId: categories[0]?.id || "",
                                  title: categories[0]?.name || "Category",
                                  description: "",
                                  href: "/catalog",
                                  image: "",
                                },
                              ],
                            },
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add card
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {(b.data.items || []).map((it: any, idx: number) => (
                        <div key={idx} className="rounded border p-3">
                          <div className="grid gap-2 sm:grid-cols-4">
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Category</Label>
                              <Select
                                value={it.categoryId}
                                onValueChange={(v) =>
                                  updateBlockLocal(b.id, {
                                    data: {
                                      items: (b.data.items || []).map((x: any, i2: number) =>
                                        i2 === idx
                                          ? { ...x, categoryId: v, title: categories.find((c) => c.id === v)?.name }
                                          : x,
                                      ),
                                    },
                                  })
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Input
                              value={it.title || ""}
                              onChange={(e) =>
                                updateBlockLocal(b.id, {
                                  data: {
                                    items: (b.data.items || []).map((x: any, i2: number) =>
                                      i2 === idx ? { ...x, title: e.target.value } : x,
                                    ),
                                  },
                                })
                              }
                              placeholder="Title"
                              className="h-9"
                            />
                            <Input
                              value={it.href || ""}
                              onChange={(e) =>
                                updateBlockLocal(b.id, {
                                  data: {
                                    items: (b.data.items || []).map((x: any, i2: number) =>
                                      i2 === idx ? { ...x, href: e.target.value } : x,
                                    ),
                                  },
                                })
                              }
                              placeholder="Link"
                              className="h-9"
                            />
                            <Input
                              value={it.description || ""}
                              onChange={(e) =>
                                updateBlockLocal(b.id, {
                                  data: {
                                    items: (b.data.items || []).map((x: any, i2: number) =>
                                      i2 === idx ? { ...x, description: e.target.value } : x,
                                    ),
                                  },
                                })
                              }
                              placeholder="Short description"
                              className="h-9"
                            />
                          </div>

                          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_160px_auto] sm:items-center">
                            <Input
                              value={it.image || ""}
                              onChange={(e) =>
                                updateBlockLocal(b.id, {
                                  data: {
                                    items: (b.data.items || []).map((x: any, i2: number) =>
                                      i2 === idx ? { ...x, image: e.target.value } : x,
                                    ),
                                  },
                                })
                              }
                              placeholder="Image URL"
                              className="h-9"
                            />
                            <label className="inline-flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0]
                                  if (!f) return
                                  const url = await uploadToDataUrl(f)
                                  updateBlockLocal(b.id, {
                                    data: {
                                      items: (b.data.items || []).map((x: any, i2: number) =>
                                        i2 === idx ? { ...x, image: url } : x,
                                      ),
                                    },
                                  })
                                  e.currentTarget.value = ""
                                }}
                              />
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            </label>
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateBlockLocal(b.id, {
                                    data: {
                                      items: (b.data.items || []).filter((_: any, i2: number) => i2 !== idx),
                                    },
                                  })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>

                          <div className="mt-2 relative h-20 w-36 overflow-hidden rounded border">
                            <Image
                              src={
                                it.image ||
                                `/placeholder.svg?height=180&width=300&query=${encodeURIComponent(
                                  "Category " + (it.title || ""),
                                )}`
                              }
                              alt={it.title || "category"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      ))}
                      {(b.data.items || []).length === 0 && (
                        <div className="rounded border p-3 text-sm text-muted-foreground">No category cards</div>
                      )}
                    </div>
                  </div>
                )}

                {/* ABOUT */}
                {b.type === "about" && (
                  <div className="grid gap-3">
                    <Input
                      value={b.data.title || ""}
                      onChange={(e) => updateBlockLocal(b.id, { data: { title: e.target.value } })}
                      placeholder="About title"
                      className="h-9"
                    />
                    <Textarea
                      value={b.data.description || ""}
                      onChange={(e) => updateBlockLocal(b.id, { data: { description: e.target.value } })}
                      placeholder="About description"
                      rows={3}
                    />

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Paragraphs</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateBlockLocal(b.id, { data: { paragraphs: [...(b.data.paragraphs || []), ""] } })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add paragraph
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      {(b.data.paragraphs || []).map((p: string, idx: number) => (
                        <div key={idx} className="grid gap-2 rounded border p-3">
                          <Textarea
                            value={p}
                            onChange={(e) => {
                              const next = [...(b.data.paragraphs || [])]
                              next[idx] = e.target.value
                              updateBlockLocal(b.id, { data: { paragraphs: next } })
                            }}
                            placeholder={`Paragraph #${idx + 1}`}
                            rows={3}
                          />
                          <div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const next = (b.data.paragraphs || []).filter((_: string, i2: number) => i2 !== idx)
                                updateBlockLocal(b.id, { data: { paragraphs: next } })
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Features</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateBlockLocal(b.id, {
                            data: {
                              features: [...(b.data.features || []), { title: "New feature", text: "Description" }],
                            },
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add feature
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {(b.data.features || []).map((f: any, idx: number) => (
                        <div key={idx} className="grid gap-2 rounded border p-3 sm:grid-cols-3">
                          <Input
                            value={f.icon || ""}
                            onChange={(e) => {
                              const next = [...(b.data.features || [])]
                              next[idx] = { ...next[idx], icon: e.target.value }
                              updateBlockLocal(b.id, { data: { features: next } })
                            }}
                            placeholder="Icon (optional)"
                            className="h-9"
                          />
                          <Input
                            value={f.title || ""}
                            onChange={(e) => {
                              const next = [...(b.data.features || [])]
                              next[idx] = { ...next[idx], title: e.target.value }
                              updateBlockLocal(b.id, { data: { features: next } })
                            }}
                            placeholder="Title"
                            className="h-9"
                          />
                          <Input
                            value={f.text || ""}
                            onChange={(e) => {
                              const next = [...(b.data.features || [])]
                              next[idx] = { ...next[idx], text: e.target.value }
                              updateBlockLocal(b.id, { data: { features: next } })
                            }}
                            placeholder="Text"
                            className="h-9"
                          />
                          <div className="sm:col-span-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const next = (b.data.features || []).filter((_: any, i2: number) => i2 !== idx)
                                updateBlockLocal(b.id, { data: { features: next } })
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-1.5">
                      <Label className="text-xs">Background image URL</Label>
                      <Input
                        value={b.data.backgroundImage || ""}
                        onChange={(e) => updateBlockLocal(b.id, { data: { backgroundImage: e.target.value } })}
                        placeholder="https://..."
                        className="h-9"
                      />
                      <label className="inline-flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          className="h-9"
                          onChange={async (e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            const url = await uploadToDataUrl(f)
                            updateBlockLocal(b.id, { data: { backgroundImage: url } })
                            e.currentTarget.value = ""
                          }}
                        />
                        <span className="text-xs text-muted-foreground">or upload image</span>
                      </label>
                      <div className="relative mt-2 h-20 w-36 overflow-hidden rounded border">
                        <Image
                          src={b.data.backgroundImage || "/placeholder.svg?height=160&width=260&query=About"}
                          alt="About"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* FOOTER CTA */}
                {b.type === "footerCta" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={b.data.title || ""}
                      onChange={(e) => updateBlockLocal(b.id, { data: { title: e.target.value } })}
                      placeholder="Footer CTA title"
                      className="h-9"
                    />
                    <Input
                      value={b.data.subtitle || ""}
                      onChange={(e) => updateBlockLocal(b.id, { data: { subtitle: e.target.value } })}
                      placeholder="Subtitle"
                      className="h-9"
                    />
                    <Textarea
                      value={b.data.body || ""}
                      onChange={(e) => updateBlockLocal(b.id, { data: { body: e.target.value } })}
                      placeholder="Body (optional)"
                      className="sm:col-span-2"
                      rows={3}
                    />
                    <Input
                      value={b.data.button?.label || ""}
                      onChange={(e) =>
                        updateBlockLocal(b.id, {
                          data: { button: { ...(b.data.button || {}), label: e.target.value } },
                        })
                      }
                      placeholder="Button label"
                      className="h-9"
                    />
                    <Input
                      value={b.data.button?.href || ""}
                      onChange={(e) =>
                        updateBlockLocal(b.id, { data: { button: { ...(b.data.button || {}), href: e.target.value } } })
                      }
                      placeholder="Button href"
                      className="h-9"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
