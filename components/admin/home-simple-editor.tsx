"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Eye, Rocket, Save, Upload, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Block, BlockType, HomeContent } from "@/lib/home-content"
import { defaultHome } from "@/lib/home-content"

type CategoryLite = { id: string; name: string }

const DRAFT_KEY = "home:draft"

function useDraft(): [HomeContent, React.Dispatch<React.SetStateAction<HomeContent>>] {
  const [draft, setDraft] = useState<HomeContent>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as HomeContent
          const validatedBlocks = parsed.blocks.map((block) => {
            if (block.type === "footerCta") {
              const data = block.data as any
              return {
                ...block,
                data: {
                  ...data,
                  button: data.button || { label: "Create Now", href: "/create-n-order" },
                },
              }
            }
            return block
          })
          return { ...parsed, blocks: validatedBlocks }
        } catch {}
      }
    }
    return defaultHome()
  })
  return [draft, setDraft]
}

function moveBlock(blocks: Block[], id: string, dir: "up" | "down") {
  const arr = [...blocks].sort((a, b) => a.position - b.position)
  const idx = arr.findIndex((b) => b.id === id)
  if (idx === -1) return arr
  const swapIdx = dir === "up" ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= arr.length) return arr
  const tmp = arr[idx].position
  arr[idx].position = arr[swapIdx].position
  arr[swapIdx].position = tmp
  return arr.sort((a, b) => a.position - b.position)
}

function ImageInput({
  value,
  onChange,
  label,
  placeholder,
}: {
  value?: string
  onChange: (v: string) => void
  label: string
  placeholder?: string
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://... or data:image/..."}
          className="h-8 text-sm"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => {
              const url = reader.result as string
              onChange(url)
            }
            reader.readAsDataURL(file)
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-8 px-2 bg-transparent"
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-1">
        <img
          src={value || "/placeholder.svg?height=120&width=180&query=preview"}
          alt="Preview"
          className="h-20 w-28 rounded border object-cover"
        />
      </div>
    </div>
  )
}

export default function HomeSimpleEditor() {
  const { toast } = useToast()
  const [draft, setDraft] = useDraft()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<CategoryLite[]>([])

  // Load categories for the Categories block
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load categories")
        const data = await res.json()
        const items = (data.items || []) as Array<{ id: string; name: string }>
        if (!cancelled) setCategories(items.map((i) => ({ id: i.id, name: i.name })))
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const blocks = useMemo(() => [...draft.blocks].sort((a, b) => a.position - b.position), [draft.blocks])

  function updateBlock<T extends BlockType>(id: string, updater: (prev: Extract<Block, { id: string }>) => Block) {
    setDraft((d) => {
      const arr = d.blocks.map((b) => (b.id === id ? updater(b as any) : b))
      return { ...d, blocks: arr }
    })
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    toast({ description: "Draft saved locally" })
  }

  function openPreview() {
    try {
      sessionStorage.setItem("home:preview", JSON.stringify(draft))
    } catch {}
    window.open("/?preview=1", "_blank")
  }

  async function publish() {
    setSaving(true)
    try {
      const res = await fetch("/api/home-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error("Publish failed")
      toast({ description: "Published" })
    } catch (e: any) {
      toast({ description: e?.message || "Failed to publish" })
    } finally {
      setSaving(false)
    }
  }

  function autoFillFirst4Categories() {
    if (categories.length === 0) return
    const first4 = categories.slice(0, 4)
    const catBlock = blocks.find((b) => b.type === "categoryGrid")
    if (!catBlock) return
    updateBlock(catBlock.id, (prev) => {
      const items = first4.map((c) => ({
        categoryId: c.id,
        title: c.name,
        description: "",
        image: "/category-card.png",
        href: "/catalog",
      }))
      return { ...prev, data: { ...(prev.data as any), items } }
    })
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={saveDraft} variant="outline" className="h-8 bg-transparent">
          <Save className="mr-2 h-4 w-4" />
          Save Draft
        </Button>
        <Button onClick={openPreview} variant="outline" className="h-8 bg-transparent">
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button onClick={publish} disabled={saving} className="h-8 bg-emerald-600 hover:bg-emerald-700">
          <Rocket className="mr-2 h-4 w-4" />
          {saving ? "Publishing..." : "Publish"}
        </Button>
        <div className="ml-auto text-xs text-muted-foreground">Blocks: {blocks.length}</div>
      </div>

      <div className="grid gap-4">
        {blocks.map((b, idx) => (
          <Card key={b.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base capitalize">{b.type}</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${b.id}`} className="text-xs">
                    Enabled
                  </Label>
                  <Switch
                    id={`active-${b.id}`}
                    checked={b.isActive}
                    onCheckedChange={(val) => updateBlock(b.id, (prev) => ({ ...prev, isActive: val }))}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => setDraft((d) => ({ ...d, blocks: moveBlock(d.blocks, b.id, "up") }))}
                  disabled={idx === 0}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => setDraft((d) => ({ ...d, blocks: moveBlock(d.blocks, b.id, "down") }))}
                  disabled={idx === blocks.length - 1}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {b.type === "hero" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input
                      className="h-8 text-sm"
                      value={(b.data as any).title || ""}
                      onChange={(e) =>
                        updateBlock(b.id, (prev) => ({
                          ...prev,
                          data: { ...(prev.data as any), title: e.target.value },
                        }))
                      }
                    />
                    <Label>Subtitle</Label>
                    <Textarea
                      className="min-h-[72px] text-sm"
                      value={(b.data as any).subtitle || ""}
                      onChange={(e) =>
                        updateBlock(b.id, (prev) => ({
                          ...prev,
                          data: { ...(prev.data as any), subtitle: e.target.value },
                        }))
                      }
                    />
                    <Label>Body</Label>
                    <Textarea
                      className="min-h-[72px] text-sm"
                      value={(b.data as any).body || ""}
                      onChange={(e) =>
                        updateBlock(b.id, (prev) => ({
                          ...prev,
                          data: { ...(prev.data as any), body: e.target.value },
                        }))
                      }
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>CTA Label</Label>
                        <Input
                          className="h-8 text-sm"
                          value={(b.data as any).ctas?.[0]?.label || ""}
                          onChange={(e) =>
                            updateBlock(b.id, (prev) => {
                              const p = prev.data as any
                              const ctas =
                                Array.isArray(p.ctas) && p.ctas.length ? [...p.ctas] : [{ label: "", href: "" }]
                              ctas[0] = { ...(ctas[0] || {}), label: e.target.value }
                              return { ...prev, data: { ...p, ctas } }
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>CTA Link</Label>
                        <Input
                          className="h-8 text-sm"
                          value={(b.data as any).ctas?.[0]?.href || "/create-n-order"}
                          onChange={(e) =>
                            updateBlock(b.id, (prev) => {
                              const p = prev.data as any
                              const ctas =
                                Array.isArray(p.ctas) && p.ctas.length ? [...p.ctas] : [{ label: "", href: "" }]
                              ctas[0] = { ...(ctas[0] || {}), href: e.target.value }
                              return { ...prev, data: { ...p, ctas } }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <ImageInput
                    label="Background Image"
                    value={(b.data as any).backgroundImage}
                    onChange={(v) =>
                      updateBlock(b.id, (prev) => ({ ...prev, data: { ...(prev.data as any), backgroundImage: v } }))
                    }
                  />
                </div>
              )}

              {b.type === "categoryGrid" && (
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 bg-transparent"
                      onClick={autoFillFirst4Categories}
                    >
                      Auto‑fill 4
                    </Button>
                    <Button
                      type="button"
                      className="h-8"
                      onClick={() =>
                        updateBlock(b.id, (prev) => {
                          const p = prev.data as any
                          const items = Array.isArray(p.items) ? [...p.items] : []
                          items.push({
                            categoryId: categories[0]?.id || "",
                            title: categories[0]?.name || "",
                            description: "",
                            image: "/category-card.png",
                            href: "/catalog",
                          })
                          return { ...prev, data: { ...p, items } }
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Card
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {((b.data as any).items || []).map((it: any, i: number) => (
                      <div key={i} className="rounded border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-sm font-medium">Card #{i + 1}</div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-2 bg-transparent"
                            onClick={() =>
                              updateBlock(b.id, (prev) => {
                                const p = prev.data as any
                                const items = [...(p.items || [])]
                                items.splice(i, 1)
                                return { ...prev, data: { ...p, items } }
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select
                              value={it.categoryId || ""}
                              onValueChange={(val) =>
                                updateBlock(b.id, (prev) => {
                                  const p = prev.data as any
                                  const items = [...(p.items || [])]
                                  items[i] = { ...(items[i] || {}), categoryId: val }
                                  return { ...prev, data: { ...p, items } }
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
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
                          <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input
                              className="h-8 text-sm"
                              value={it.title || ""}
                              onChange={(e) =>
                                updateBlock(b.id, (prev) => {
                                  const p = prev.data as any
                                  const items = [...(p.items || [])]
                                  items[i] = { ...(items[i] || {}), title: e.target.value }
                                  return { ...prev, data: { ...p, items } }
                                })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Link</Label>
                            <Input
                              className="h-8 text-sm"
                              value={it.href || "/catalog"}
                              onChange={(e) =>
                                updateBlock(b.id, (prev) => {
                                  const p = prev.data as any
                                  const items = [...(p.items || [])]
                                  items[i] = { ...(items[i] || {}), href: e.target.value }
                                  return { ...prev, data: { ...p, items } }
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                              className="min-h-[72px] text-sm"
                              value={it.description || ""}
                              onChange={(e) =>
                                updateBlock(b.id, (prev) => {
                                  const p = prev.data as any
                                  const items = [...(p.items || [])]
                                  items[i] = { ...(items[i] || {}), description: e.target.value }
                                  return { ...prev, data: { ...p, items } }
                                })
                              }
                            />
                          </div>
                          <ImageInput
                            label="Image"
                            value={it.image}
                            onChange={(v) =>
                              updateBlock(b.id, (prev) => {
                                const p = prev.data as any
                                const items = [...(p.items || [])]
                                items[i] = { ...(items[i] || {}), image: v }
                                return { ...prev, data: { ...p, items } }
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                    {((b.data as any).items || []).length === 0 && (
                      <div className="text-xs text-muted-foreground">No cards yet. Use Auto‑fill 4 or Add Card.</div>
                    )}
                  </div>
                </div>
              )}

              {b.type === "about" && (
                <div className="grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_240px] sm:items-start">
                    <div className="grid gap-2">
                      <Label>Title</Label>
                      <Input
                        className="h-8 text-sm"
                        value={(b.data as any).title || ""}
                        onChange={(e) =>
                          updateBlock(b.id, (prev) => ({
                            ...prev,
                            data: { ...(prev.data as any), title: e.target.value },
                          }))
                        }
                      />
                      <Label>Description</Label>
                      <Textarea
                        className="min-h-[72px] text-sm"
                        value={(b.data as any).description || ""}
                        onChange={(e) =>
                          updateBlock(b.id, (prev) => ({
                            ...prev,
                            data: { ...(prev.data as any), description: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <ImageInput
                      label="Background Image"
                      value={(b.data as any).backgroundImage}
                      onChange={(v) =>
                        updateBlock(b.id, (prev) => ({
                          ...prev,
                          data: { ...(prev.data as any), backgroundImage: v },
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Paragraphs</Label>
                    <div className="grid gap-2">
                      {(((b.data as any).paragraphs as string[]) || []).map((p, i) => (
                        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <Input
                            className="h-8 text-sm"
                            value={p}
                            onChange={(e) =>
                              updateBlock(b.id, (prev) => {
                                const arr = [...(((prev.data as any).paragraphs as string[]) || [])]
                                arr[i] = e.target.value
                                return { ...prev, data: { ...(prev.data as any), paragraphs: arr } }
                              })
                            }
                          />
                          <Button
                            variant="outline"
                            className="h-8 bg-transparent"
                            onClick={() =>
                              updateBlock(b.id, (prev) => {
                                const arr = [...(((prev.data as any).paragraphs as string[]) || [])]
                                arr.splice(i, 1)
                                return { ...prev, data: { ...(prev.data as any), paragraphs: arr } }
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 w-fit bg-transparent"
                        onClick={() =>
                          updateBlock(b.id, (prev) => {
                            const arr = [...(((prev.data as any).paragraphs as string[]) || [])]
                            arr.push("")
                            return { ...prev, data: { ...(prev.data as any), paragraphs: arr } }
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add paragraph
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Features</Label>
                    <div className="grid gap-3">
                      {(((b.data as any).features as any[]) || []).map((f, i) => (
                        <div key={i} className="grid gap-2 sm:grid-cols-3">
                          <Input
                            className="h-8 text-sm"
                            placeholder="Title"
                            value={f.title || ""}
                            onChange={(e) =>
                              updateBlock(b.id, (prev) => {
                                const arr = [...(((prev.data as any).features as any[]) || [])]
                                arr[i] = { ...(arr[i] || {}), title: e.target.value }
                                return { ...prev, data: { ...(prev.data as any), features: arr } }
                              })
                            }
                          />
                          <Input
                            className="h-8 text-sm"
                            placeholder="Text"
                            value={f.text || ""}
                            onChange={(e) =>
                              updateBlock(b.id, (prev) => {
                                const arr = [...(((prev.data as any).features as any[]) || [])]
                                arr[i] = { ...(arr[i] || {}), text: e.target.value }
                                return { ...prev, data: { ...(prev.data as any), features: arr } }
                              })
                            }
                          />
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              className="h-8 bg-transparent"
                              onClick={() =>
                                updateBlock(b.id, (prev) => {
                                  const arr = [...(((prev.data as any).features as any[]) || [])]
                                  arr.splice(i, 1)
                                  return { ...prev, data: { ...(prev.data as any), features: arr } }
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 w-fit bg-transparent"
                        onClick={() =>
                          updateBlock(b.id, (prev) => {
                            const arr = [...(((prev.data as any).features as any[]) || [])]
                            arr.push({ title: "", text: "" })
                            return { ...prev, data: { ...(prev.data as any), features: arr } }
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add feature
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {b.type === "footerCta" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input
                      className="h-8 text-sm"
                      value={(b.data as any).title || ""}
                      onChange={(e) =>
                        updateBlock(b.id, (prev) => ({
                          ...prev,
                          data: { ...(prev.data as any), title: e.target.value },
                        }))
                      }
                    />
                    <Label>Subtitle</Label>
                    <Input
                      className="h-8 text-sm"
                      value={(b.data as any).subtitle || ""}
                      onChange={(e) =>
                        updateBlock(b.id, (prev) => ({
                          ...prev,
                          data: { ...(prev.data as any), subtitle: e.target.value },
                        }))
                      }
                    />
                    <Label>Body</Label>
                    <Textarea
                      className="min-h-[72px] text-sm"
                      value={(b.data as any).body || ""}
                      onChange={(e) =>
                        updateBlock(b.id, (prev) => ({
                          ...prev,
                          data: { ...(prev.data as any), body: e.target.value },
                        }))
                      }
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Button Label</Label>
                        <Input
                          className="h-8 text-sm"
                          value={(b.data as any).button?.label || "Create Now"}
                          onChange={(e) =>
                            updateBlock(b.id, (prev) => {
                              const currentButton = (prev.data as any).button || {
                                label: "Create Now",
                                href: "/create-n-order",
                              }
                              const button = {
                                ...currentButton,
                                label: e.target.value,
                              }
                              return { ...prev, data: { ...(prev.data as any), button } }
                            })
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Button Link</Label>
                        <Input
                          className="h-8 text-sm"
                          value={(b.data as any).button?.href || "/create-n-order"}
                          onChange={(e) =>
                            updateBlock(b.id, (prev) => {
                              const currentButton = (prev.data as any).button || {
                                label: "Create Now",
                                href: "/create-n-order",
                              }
                              const button = {
                                ...currentButton,
                                href: e.target.value,
                              }
                              return { ...prev, data: { ...(prev.data as any), button } }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="opacity-70">
                    <div className="text-sm text-muted-foreground">No image for this block in the minimal editor.</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
