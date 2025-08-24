"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { SiteFooter } from "@/components/site-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Minus, Plus, Trash2, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { CartItem } from "@/lib/cart"
import { subscribeCart, updateCartItem, removeCartItem, cartTotals, addToCart, buildVariantKey } from "@/lib/cart"
import { CartEditPortal, openEditCartItemDialog } from "@/components/cart/edit-portal"

type Category = "Wall Panel" | "Flooring" | "Adhesive" | "Accessories"

type Product = {
  id: string
  category: Category
  sub: string
  name: string
  thickness: string[]
  sizes: string[]
  pcsPerBox: number
  boxKg: number
  boxM3: number
  image: string
  colors: string[]
}

type RowState = {
  size: string
  thickness: string
  color: string
  boxes: number
}

const CATEGORIES: Category[] = ["Wall Panel", "Flooring", "Adhesive", "Accessories"]
const TABS: Array<"ALL" | Category> = ["ALL", ...CATEGORIES]

// Utils
function safeNum(n: unknown, fallback = 0) {
  const v = Number(n)
  return Number.isFinite(v) ? v : fallback
}
function safeStr(n: unknown, fallback = "") {
  if (n === undefined || n === null) return fallback
  return String(n)
}
function pct(part: number, whole: number) {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0
  const p = (part / whole) * 100
  return Math.max(0, Math.min(100, Math.round(p)))
}

// Normalize category strings coming from API into one of the 4 tabs
function normalizeCategory(input: unknown): Category {
  const c = String(input || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .trim()
  if (["wall panel", "wall", "panels", "panel"].includes(c)) return "Wall Panel"
  if (["flooring", "floor"].includes(c)) return "Flooring"
  if (["adhesive", "glue", "adhesives"].includes(c)) return "Adhesive"
  if (["accessory", "accessories", "trim", "tools"].includes(c)) return "Accessories"
  // Default bucket
  return "Accessories"
}

// Normalize subcategory (fallback to "General")
function normalizeSub(input: unknown): string {
  const s = safeStr(input, "").trim()
  return s || "General"
}

export default function CreateNOrderPage() {
  const { toast } = useToast()

  // Catalog fetched from API (only show actual products)
  const [catalog, setCatalog] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch("/api/products?limit=1000", { cache: "no-store" })
        const data = await res.json()
        const list: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []

        const mapped: Product[] = list.map((p: any) => {
          const category = normalizeCategory(p?.category)
          const sub = normalizeSub(p?.sub ?? p?.subcategory ?? p?.subCategory ?? p?.sub_cat)
          
          // Extract sizes and thicknesses from technical specifications
          const sizes = Array.isArray(p?.sizes) ? p.sizes.map((x: any) => String(x)) : []
          const thickness = Array.isArray(p?.thickness) ? p.thickness.map((x: any) => String(x)) : []
          
          // Extract colors from both legacy and new structure
          let colors: string[] = []
          if (Array.isArray(p?.colorVariants)) {
            colors = p.colorVariants
              .map((c: any) => c?.name || "")
              .filter(Boolean)
              .map((s: any) => String(s))
          } else if (Array.isArray(p?.colors)) {
            colors = p.colors
              .map((c: any) => c?.nameEn || c?.nameRU || c?.nameRu || c?.name || "")
              .filter(Boolean)
              .map((s: any) => String(s))
          }

          return {
            id: String(p?.id || p?.sku || p?.slug || p?.name),
            category,
            sub,
            name: String(p?.name || "Product"),
            thickness,
            sizes,
            pcsPerBox: safeNum(p?.pcsPerBox, 0),
            boxKg: safeNum(p?.boxKg, 0),
            boxM3: safeNum(p?.boxM3, 0),
            image: p?.thumbnailUrl || p?.photos?.main || "/product-thumbnail.png",
            colors,
          }
        })

        if (active) setCatalog(mapped)
      } catch (e) {
        console.error(e)
        if (active)
          toast({
            title: "Ошибка загрузки каталога",
            description: "Не удалось получить данные. Попробуйте обновить страницу.",
            variant: "destructive",
          })
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [toast])

  // UI state for rows
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("ALL")
  const [subFilter, setSubFilter] = useState<string>("All")
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [invalidRow, setInvalidRow] = useState<string | null>(null)

  // Containers
  const containers = {
    "20": { label: "20'", kg: 28000, m3: 28 },
    "40": { label: "40'", kg: 28000, m3: 68 },
  } as const
  const [container, setContainer] = useState<keyof typeof containers>("40")

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  useEffect(() => {
    const unsub = subscribeCart((items) => setCartItems(items))
    return () => unsub()
  }, [])

  const getRow = (p: Product): RowState => {
    const r = rows[p.id]
    return {
      size: r?.size ?? "",
      thickness: r?.thickness ?? "",
      color: r?.color ?? "",
      boxes: safeNum(r?.boxes, 0),
    }
  }

  const setRow = (id: string, patch: Partial<RowState>) => {
    setRows((prev) => {
      const current = prev[id] ?? { size: "", thickness: "", color: "", boxes: 0 }
      const merged = { ...current, ...patch }
      merged.boxes = safeNum(merged.boxes, 0)
      return { ...prev, [id]: merged }
    })
  }

  // Filtered list by Category and Sub
  const visible = useMemo(() => {
    const base = activeTab === "ALL" ? catalog : catalog.filter((p) => p.category === activeTab)
    return base.filter((p) => (activeTab === "ALL" || subFilter === "All" ? true : p.sub === subFilter))
  }, [activeTab, subFilter, catalog])

  // Build sub list dynamically for the active category
  const subsForTab = useMemo(() => {
    if (activeTab === "ALL") return []
    const set = new Set<string>()
    for (const p of catalog) {
      if (p.category === activeTab) set.add(p.sub)
    }
    const subs = Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
    return ["All", ...subs]
  }, [activeTab, catalog])

  function ensureSelected(p: Product, row: RowState) {
    const needColor = p.colors.length > 0
    const ok = Boolean(row.size) && Boolean(row.thickness) && (needColor ? Boolean(row.color) : true)
    if (!ok) {
      toast({
        title: "Выберите параметры",
        description: "Укажите цвет, толщину и размер.",
        variant: "destructive",
      })
      setInvalidRow(p.id)
      setTimeout(() => setInvalidRow(null), 1400)
    }
    return ok
  }

  function addRowToCart(p: Product) {
    const r = getRow(p)
    if (!r.boxes || r.boxes <= 0) {
      toast({
        title: "Укажите количество коробок",
        description: "Введите количество коробок перед добавлением в корзину.",
        variant: "destructive",
      })
      setInvalidRow(p.id)
      setTimeout(() => setInvalidRow(null), 1400)
      return
    }
    if (!ensureSelected(p, r)) return

    const variantKey = buildVariantKey(p.id, r.color, r.size, r.thickness)
    const existing = cartItems.find((i) => i.variantKey === variantKey)

    if (existing) {
      updateCartItem(variantKey, { qtyBoxes: r.boxes })
      toast({ title: "Обновлено", description: "Позиция в корзине обновлена." })
    } else {
      addToCart({
        id: p.id,
        sku: p.id,
        name: p.name,
        category: p.category,
        sub: p.sub || "",
        color: p.colors.length ? r.color : "",
        size: r.size,
        thickness: r.thickness,
        qtyBoxes: r.boxes,
        pcsPerBox: p.pcsPerBox,
        boxKg: p.boxKg,
        boxM3: p.boxM3,
        thumbnailUrl: p.image,
        addedAt: Date.now(),
      })
      toast({
        title: "Добавлено в корзину",
        description: `${p.name} (${[r.color, r.thickness, r.size].filter(Boolean).join(", ")})`,
      })
    }
  }

  // Local row handlers (no auto-sync)
  const stepBoxes = (p: Product, delta: number) => {
    const r = getRow(p)
    const next = { ...r, boxes: Math.max(0, r.boxes + delta) }
    if (!ensureSelected(p, next)) return
    setRow(p.id, { boxes: next.boxes })
  }
  const setBoxesFromInput = (p: Product, val: string) => {
    const r = getRow(p)
    const next = { ...r, boxes: Math.max(0, Math.floor(Number(val) || 0)) }
    if (!ensureSelected(p, next)) return
    setRow(p.id, { boxes: next.boxes })
  }
  const keyAdjust = (e: React.KeyboardEvent<HTMLInputElement>, p: Product) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      const r = getRow(p)
      const delta = (e.shiftKey ? 5 : 1) * (e.key === "ArrowUp" ? 1 : -1)
      const next = { ...r, boxes: Math.max(0, r.boxes + delta) }
      if (!ensureSelected(p, next)) return
      setRow(p.id, { boxes: next.boxes })
    }
  }
  const onChangeSelect = (p: Product, patch: Partial<RowState>) => {
    setRow(p.id, patch)
  }

  // Totals from cart (source of truth)
  const totals = useMemo(() => cartTotals(cartItems), [cartItems])
  const targetKG = containers[container].kg
  const targetM3 = containers[container].m3
  const totalKgStr = safeNum(totals.totalKg, 0).toFixed(0)
  const totalM3Str = safeNum(totals.totalM3, 0).toFixed(1)
  const kgPercent = pct(safeNum(totals.totalKg, 0), targetKG)
  const m3Percent = pct(safeNum(totals.totalM3, 0), targetM3)

  // CSV
  const exportCSV = () => {
    const header = [
      "Category",
      "Name",
      "Size",
      "Thickness",
      "Color",
      "Pcs/Box",
      "Boxes",
      "Total Pcs",
      "Box/Kg",
      "Box/m3",
      "Total Kg",
      "Total m3",
      "SKU",
    ]
    const rowsCsv = cartItems.map((i) => {
      const qty = safeNum(i.qtyBoxes, 0)
      const pcsPerBox = safeNum(i.pcsPerBox, 0)
      const boxKg = safeNum(i.boxKg, 0)
      const boxM3 = safeNum(i.boxM3, 0)
      return [
        safeStr(i.category),
        safeStr(i.name),
        safeStr(i.size),
        safeStr(i.thickness),
        safeStr(i.color),
        pcsPerBox,
        qty,
        qty * pcsPerBox,
        boxKg.toFixed(1),
        boxM3.toFixed(2),
        (qty * boxKg).toFixed(1),
        (qty * boxM3).toFixed(2),
        safeStr(i.sku),
      ]
    })
    const csv = [header, ...rowsCsv].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "order.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // PDF
  const printPDF = () => {
    const win = window.open("", "PRINT", "height=650,width=900,top=100,left=150")
    if (!win) return
    win.document.write("<html><head><title>Order</title></head><body>")
    win.document.write(`<h2>Total order</h2>`)
    win.document.write(
      `<p style="font-size:14px"><b>Boxes:</b> ${safeNum(totals.totalBoxes, 0)} &nbsp; <b>Pcs:</b> ${safeNum(
        totals.totalPcs,
        0,
      )} &nbsp; <b>Total KG:</b> ${totalKgStr} &nbsp; <b>Total m3:</b> ${totalM3Str}</p>`,
    )
    win.document.write(
      "<table border='1' cellspacing='0' cellpadding='6'><tr><th>Category</th><th>Name</th><th>Size</th><th>Thickness</th><th>Color</th><th>Pcs/Box</th><th>Boxes</th><th>Total Pcs</th><th>Box/Kg</th><th>Box/m3</th><th>Total Kg</th><th>Total m3</th><th>SKU</th></tr>",
    )
    cartItems.forEach((i) => {
      const qty = safeNum(i.qtyBoxes, 0)
      const pcsPerBox = safeNum(i.pcsPerBox, 0)
      const boxKg = safeNum(i.boxKg, 0)
      const boxM3 = safeNum(i.boxM3, 0)
      win!.document.write(
        `<tr><td>${safeStr(i.category)}</td><td>${safeStr(i.name)}</td><td>${safeStr(i.size)}</td><td>${safeStr(
          i.thickness,
        )}</td><td>${safeStr(i.color)}</td><td>${pcsPerBox}</td><td>${qty}</td><td>${
          qty * pcsPerBox
        }</td><td>${boxKg.toFixed(1)}</td><td>${boxM3.toFixed(2)}</td><td>${(qty * boxKg).toFixed(1)}</td><td>${(
          qty * boxM3
        ).toFixed(2)}</td><td>${safeStr(i.sku)}</td></tr>`,
      )
    })
    win.document.write("</table></body></html>")
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="w-full py-4 md:py-5 lg:py-6 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-[50px]">
        {/* Top totals */}
        <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Create&apos;N&apos;Order</h1>
            <p className="text-sm text-muted-foreground">Быстрый, табличный ввод коробов для оптовых заказов.</p>
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground w-full md:w-auto text-right">
              Total order
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <div className="text-sm text-center">
                <div className="text-muted-foreground">Boxes</div>
                <div className="text-2xl font-semibold">{safeNum(totals.totalBoxes, 0)}</div>
              </div>
              <div className="text-sm text-center">
                <div className="text-muted-foreground">Pcs</div>
                <div className="text-2xl font-semibold">{safeNum(totals.totalPcs, 0)}</div>
              </div>
              <div className="text-sm text-center">
                <div className="text-muted-foreground">Total KG</div>
                <div className="text-2xl font-semibold text-red-600">{totalKgStr}</div>
              </div>
              <div className="text-sm text-center">
                <div className="text-muted-foreground">Total m³</div>
                <div className="text-2xl font-semibold text-red-600">{totalM3Str}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-3 lg:gap-4 xl:grid-cols-[minmax(0,1fr)_560px] 2xl:grid-cols-[minmax(0,1fr)_600px]">
          {/* Left: products table */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-1.5">
              <Tabs
                value={activeTab}
                onValueChange={(v) => {
                  setActiveTab(v as any)
                  setSubFilter("All")
                }}
              >
                <TabsList className="w-full justify-start overflow-auto">
                  {TABS.map((c) => (
                    <TabsTrigger key={c} value={c} className="whitespace-nowrap">
                      {c}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {activeTab !== "ALL" && (
                  <TabsContent value={activeTab} className="mt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {subsForTab.map((s) => (
                        <Badge
                          key={s}
                          variant={s === subFilter ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => setSubFilter(s)}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="[&>th]:py-1.5 [&>th]:px-1.5">
                      <TableHead className="text-center w-[90px]">Add</TableHead>
                      <TableHead className="text-center">Category</TableHead>
                      <TableHead className="text-center">Picture</TableHead>
                      <TableHead className="text-center">Name</TableHead>
                      <TableHead className="text-center">Color</TableHead>
                      <TableHead className="text-center">Thickness</TableHead>
                      <TableHead className="text-center">Size</TableHead>
                      <TableHead className="text-center">Pcs/Box</TableHead>
                      <TableHead className="text-center">Boxes</TableHead>
                      <TableHead className="text-center">Total Pcs</TableHead>
                      <TableHead className="text-center">Box/Kg</TableHead>
                      <TableHead className="text-center">Box/m³</TableHead>
                      <TableHead className="text-center">Total KG</TableHead>
                      <TableHead className="text-center">Total m³</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={14} className="py-6 text-center text-muted-foreground">
                          Загрузка каталога…
                        </TableCell>
                      </TableRow>
                    ) : visible.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="py-6 text-center text-muted-foreground">
                          Нет товаров
                        </TableCell>
                      </TableRow>
                    ) : (
                      visible.map((p) => {
                        const r = getRow(p)
                        const invalid = invalidRow === p.id
                        const totalPcs = r.boxes * p.pcsPerBox
                        const totalKg = r.boxes * p.boxKg
                        const totalM3 = r.boxes * p.boxM3
                        const isSelected = r.boxes > 0
                        const ready =
                          r.boxes > 0 &&
                          Boolean(r.size) &&
                          Boolean(r.thickness) &&
                          (p.colors.length ? Boolean(r.color) : true)

                        return (
                          <TableRow
                            key={p.id}
                            className={cn(
                              "[&>td]:py-1.5 [&>td]:px-1.5 transition-colors",
                              isSelected ? "bg-emerald-100/70 ring-1 ring-emerald-300" : undefined,
                            )}
                          >
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={() => addRowToCart(p)}
                                disabled={!ready}
                                aria-label="Add to cart"
                              >
                                Add
                              </Button>
                            </TableCell>

                            <TableCell className="text-center">{p.category}</TableCell>
                            <TableCell className="text-center">
                              <Image
                                src={p.image || "/placeholder.svg"}
                                alt={`${p.name} preview`}
                                width={44}
                                height={44}
                                className="mx-auto rounded border object-cover"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-center">{p.name}</TableCell>

                            <TableCell className="text-center">
                              {p.colors.length ? (
                                <Select
                                  value={r.color || undefined}
                                  onValueChange={(val) => onChangeSelect(p, { color: val })}
                                >
                                  <SelectTrigger
                                    className={cn(
                                      "mx-auto h-5 w-20 truncate text-[10px] pr-[1px] [&_svg]:h-2 [&_svg]:w-2 [&_svg]:right-0",
                                      (!r.color || invalid) && "ring-1 ring-red-500",
                                    )}
                                    aria-label="Select color"
                                    title={r.color || "Select color"}
                                  >
                                    <SelectValue placeholder="Color" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {p.colors.map((c) => (
                                      <SelectItem key={c} value={c}>
                                        {c}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>

                            <TableCell className="text-center">
                              <Select
                                value={r.thickness || undefined}
                                onValueChange={(val) => onChangeSelect(p, { thickness: val })}
                              >
                                <SelectTrigger
                                  className={cn(
                                    "mx-auto h-5 w-20 truncate text-[10px] pr-[1px] [&_svg]:h-2 [&_svg]:w-2 [&_svg]:right-0",
                                    (!r.thickness || invalid) && "ring-1 ring-red-500",
                                  )}
                                  aria-label="Select thickness"
                                  title={r.thickness || "Select thickness"}
                                >
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {p.thickness.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {t}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>

                            <TableCell className="text-center">
                              <Select
                                value={r.size || undefined}
                                onValueChange={(val) => onChangeSelect(p, { size: val })}
                              >
                                <SelectTrigger
                                  className={cn(
                                    "mx-auto h-5 w-20 truncate text-[10px] pr-[1px] [&_svg]:h-2 [&_svg]:w-2 [&_svg]:right-0",
                                    (!r.size || invalid) && "ring-1 ring-red-500",
                                  )}
                                  aria-label="Select size"
                                  title={r.size || "Select size"}
                                >
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {p.sizes.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>

                            <TableCell className="text-center">{p.pcsPerBox}</TableCell>

                            <TableCell className="text-center">
                              <div className="mx-auto inline-flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-5 w-5 bg-transparent"
                                  aria-label="Decrease boxes"
                                  onClick={() => stepBoxes(p, -1)}
                                >
                                  <Minus className="h-2 w-2" />
                                </Button>
                                <Input
                                  inputMode="numeric"
                                  type="text"
                                  className="h-6 w-12 text-center text-xs font-semibold"
                                  value={r.boxes}
                                  onKeyDown={(e) => keyAdjust(e, p)}
                                  onChange={(e) => setBoxesFromInput(p, e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-5 w-5 bg-transparent"
                                  aria-label="Increase boxes"
                                  onClick={() => stepBoxes(p, 1)}
                                >
                                  <Plus className="h-2 w-2" />
                                </Button>
                              </div>
                            </TableCell>

                            <TableCell className="text-center">{totalPcs}</TableCell>
                            <TableCell className="text-center">{p.boxKg.toFixed(1)}</TableCell>
                            <TableCell className="text-center">{p.boxM3.toFixed(2)}</TableCell>
                            <TableCell className="text-center">{totalKg.toFixed(1)}</TableCell>
                            <TableCell className="text-center">{totalM3.toFixed(2)}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Right: CART summary */}
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Container</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={container === "20" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setContainer("20")}
                      aria-pressed={container === "20"}
                    >
                      <Package className="mr-1 h-4 w-4" /> 20&apos;
                    </Button>
                    <Button
                      variant={container === "40" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setContainer("40")}
                      aria-pressed={container === "40"}
                    >
                      <Package className="mr-1 h-4 w-4" /> 40&apos;
                    </Button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded border p-2">
                    <div className="text-xs text-muted-foreground">Total KG</div>
                    <div className="text-lg font-semibold">
                      {totalKgStr} / {targetKG}
                    </div>
                  </div>
                  <div className="rounded border p-2">
                    <div className="text-xs text-muted-foreground">Total m³</div>
                    <div className="text-lg font-semibold">
                      {totalM3Str} / {targetM3}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>KG</span>
                    <span>
                      {kgPercent}% ({totalKgStr}/{targetKG})
                    </span>
                  </div>
                  <Progress value={kgPercent} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>m³</span>
                    <span>
                      {m3Percent}% ({totalM3Str}/{targetM3})
                    </span>
                  </div>
                  <Progress value={m3Percent} />
                </div>
                <Separator className="my-2" />

                {cartItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Корзина пуста. Добавьте товар со страницы каталога или слева из таблицы.
                  </p>
                ) : null}

                <div className="space-y-1">
                  {cartItems.map((i) => {
                    const qty = safeNum(i.qtyBoxes, 0)
                    const pcsPerBox = safeNum(i.pcsPerBox, 0)
                    const boxKg = safeNum(i.boxKg, 0)
                    const boxM3 = safeNum(i.boxM3, 0)
                    const totalPcs = qty * pcsPerBox
                    const totalKg = qty * boxKg
                    const totalM3 = qty * boxM3
                    const key = i.variantKey || [i.id, i.color || "", i.size || "", i.thickness || ""].join("__")
                    return (
                      <div
                        key={key}
                        className="grid grid-cols-[minmax(58px,72px)_1fr_auto] items-center gap-1 rounded border p-1"
                        onDoubleClick={() => openEditCartItemDialog(i)}
                        title="Double‑click to edit"
                      >
                        {/* Left: bigger photo, occupies maximum of its column */}
                        <div className="w-[58px] sm:w-[66px] md:w-[72px]">
                          <Image
                            src={i.thumbnailUrl || "/product-thumbnail.png"}
                            alt={i.name}
                            width={72}
                            height={72}
                            className="w-full h-auto max-h-[72px] rounded border object-cover"
                          />
                        </div>

                        {/* Center: 3 very compact rows */}
                        <div className="min-w-0 leading-3">
                          {/* Row 1: Category · Product */}
                          <div className="truncate text-[12px] sm:text-[13px] font-semibold leading-tight">
                            {safeStr(i.category)} {" · "} {safeStr(i.name)}
                          </div>

                          {/* Row 2: S/T/C — red, single-line per chip */}
                          <div className="mt-0.5 grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => openEditCartItemDialog(i)}
                              className="rounded border border-red-400/70 px-1 py-0.5 h-[18px] text-center text-[10px] font-medium text-red-700 hover:bg-red-50 hover:ring-2 hover:ring-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 truncate"
                              title={safeStr(i.size, "-")}
                              aria-label="Редактировать размер"
                            >
                              {"S: "}
                              {safeStr(i.size, "-")}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCartItemDialog(i)}
                              className="rounded border border-red-400/70 px-1 py-0.5 h-[18px] text-center text-[10px] font-medium text-red-700 hover:bg-red-50 hover:ring-2 hover:ring-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 truncate"
                              title={safeStr(i.thickness, "-")}
                              aria-label="Редактировать толщину"
                            >
                              {"T: "}
                              {safeStr(i.thickness, "-")}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCartItemDialog(i)}
                              className="rounded border border-red-400/70 px-1 py-0.5 h-[18px] text-center text-[10px] font-medium text-red-700 hover:bg-red-50 hover:ring-2 hover:ring-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 truncate"
                              title={safeStr(i.color, "-")}
                              aria-label="Редактировать цвет"
                            >
                              {"C: "}
                              {safeStr(i.color, "-")}
                            </button>
                          </div>

                          {/* Row 3: Pcs/KG/m³ — black, read-only */}
                          <div className="mt-0.5 grid grid-cols-3 gap-1">
                            <div
                              className="rounded border border-black/60 bg-white px-1 py-0.5 h-[18px] text-center text-[10px] font-semibold text-black truncate"
                              title={String(totalPcs)}
                            >
                              {"Pcs: "}
                              {totalPcs}
                            </div>
                            <div
                              className="rounded border border-black/60 bg-white px-1 py-0.5 h-[18px] text-center text-[10px] font-semibold text-black truncate"
                              title={totalKg.toFixed(1)}
                            >
                              {"KG: "}
                              {totalKg.toFixed(1)}
                            </div>
                            <div
                              className="rounded border border-black/60 bg-white px-1 py-0.5 h-[18px] text-center text-[10px] font-semibold text-black truncate"
                              title={totalM3.toFixed(2)}
                            >
                              {"m³: "}
                              {totalM3.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Right: ultra-compact qty controls + delete */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-4 w-4 bg-transparent"
                              onClick={() => updateCartItem(key, { qtyBoxes: Math.max(0, qty - 1) })}
                              aria-label="Decrease"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              value={qty}
                              onChange={(e) =>
                                updateCartItem(key, { qtyBoxes: Math.max(0, Math.floor(Number(e.target.value) || 0)) })
                              }
                              inputMode="numeric"
                              type="text"
                              className="h-5 w-10 text-center text-[10px] font-semibold bg-emerald-50/60 px-1"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-4 w-4 bg-transparent"
                              onClick={() => updateCartItem(key, { qtyBoxes: qty + 1 })}
                              aria-label="Increase"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => removeCartItem(key)}
                            aria-label="Remove item"
                            title="Remove item"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {cartItems.length > 0 && (
                  <div className="grid gap-2 pt-2">
                    <Button onClick={exportCSV} variant="outline">
                      Download Order (Excel CSV)
                    </Button>
                    <Button onClick={printPDF} variant="outline">
                      Download Order (PDF)
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => alert("Order submitted (mock). Backend integration next.")}
                    >
                      Submit Order
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Mount the edit dialog portal */}
      <CartEditPortal />

      <SiteFooter />
    </div>
  )
}
