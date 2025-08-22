"use client"

import * as React from "react"
import Image from "next/image"
import type { Page } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

// Minimal, typed structure we store as JSON inside page.content ONLY for the Home ("/") page.
type HomeSections = {
  hero: {
    shown: boolean
    title: string
    subtitle: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel: string
    secondaryHref: string
    image?: string
  }
  about: {
    shown: boolean
    title: string
    description: string
    image?: string
  }
  footerCta: {
    shown: boolean
    title: string
    subtitle: string
    body?: string
    buttonLabel: string
    buttonHref: string
  }
}

const defaultSections: HomeSections = {
  hero: {
    shown: true,
    title: "Premium panels and flooring for modern interiors",
    subtitle:
      "Build wholesale orders in minutes. Track boxes, kg, m³. Export to PDF/Excel and streamline your back-office.",
    primaryLabel: "Create Now",
    primaryHref: "/create-n-order",
    secondaryLabel: "Browse Catalog",
    secondaryHref: "/catalog",
    image: undefined,
  },
  about: {
    shown: true,
    title: "About Stick'N'Style",
    description:
      "We help designers and wholesalers create beautiful, functional interiors with premium 3D wall panels, flooring, and adhesive solutions.",
    image: undefined,
  },
  footerCta: {
    shown: true,
    title: "Create an order in 1 click",
    subtitle: "Fast and accurate orders for B2B partners",
    body: "",
    buttonLabel: "Create Now",
    buttonHref: "/create-n-order",
  },
}

function safeParseSections(content?: string | null): HomeSections {
  if (!content) return defaultSections
  try {
    const parsed = JSON.parse(content) as Partial<HomeSections>
    return {
      hero: { ...defaultSections.hero, ...(parsed.hero || {}) },
      about: { ...defaultSections.about, ...(parsed.about || {}) },
      footerCta: { ...defaultSections.footerCta, ...(parsed.footerCta || {}) },
    }
  } catch {
    return defaultSections
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}

function aspectToClass(aspect?: string) {
  // Only stable, known ratios to avoid Tailwind JIT issues.
  switch (aspect) {
    case "16 / 9":
    case "16/9":
      return "aspect-[16/9]"
    case "1 / 1":
    case "1/1":
      return "aspect-square"
    case "4 / 3":
    case "4/3":
    default:
      return "aspect-[4/3]"
  }
}

function ImagePicker({
  label,
  value,
  onChange,
  aspect = "4 / 3",
  addLabel = "Add photo",
}: {
  label: string
  value?: string
  onChange: (dataUrl?: string) => void
  aspect?: string
  addLabel?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const aspectClass = aspectToClass(aspect)

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative overflow-hidden rounded-md border">
        <div className={`relative w-full ${aspectClass}`}>
          {value ? (
            <Image src={value || "/placeholder.svg"} alt={label} fill className="object-cover" />
          ) : (
            <Image src="/abstract-geometric-shapes.png" alt="placeholder" fill className="object-cover opacity-60" />
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/40 p-1.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            className="h-7 px-2 text-xs bg-white text-gray-900 hover:bg-gray-100"
          >
            {value ? "Change" : addLabel}
          </Button>
          {value && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(undefined)}
              className="h-7 px-2 text-xs text-white hover:bg-white/10"
            >
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const dataUrl = await fileToDataUrl(f)
            onChange(dataUrl)
          }}
        />
      </div>
    </div>
  )
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  page?: Page | null
  onSaved?: (page: Page) => void
}

export function PageForm({ open, onOpenChange, page, onSaved }: Props) {
  const { toast } = useToast()

  // Basics tab fields (existing API supports these)
  const [title, setTitle] = React.useState(page?.title ?? "")
  const [path, setPath] = React.useState(page?.path ?? "/new-page")
  const [visible, setVisible] = React.useState<boolean>(page?.visible ?? true)
  const [seoTitle, setSeoTitle] = React.useState(page?.seoTitle ?? page?.title ?? "")
  const [seoDescription, setSeoDescription] = React.useState(page?.seoDescription ?? "")
  const [content, setContent] = React.useState(page?.content ?? "")

  // Homepage sections (stored as JSON string in content when path === "/")
  const [sections, setSections] = React.useState<HomeSections>(
    page?.path === "/" ? safeParseSections(page?.content) : defaultSections,
  )

  React.useEffect(() => {
    // Synchronize when modal opens with a different page
    setTitle(page?.title ?? "")
    setPath(page?.path ?? "/new-page")
    setVisible(page?.visible ?? true)
    setSeoTitle(page?.seoTitle ?? page?.title ?? "")
    setSeoDescription(page?.seoDescription ?? "")
    setContent(page?.content ?? "")
    setSections(page?.path === "/" ? safeParseSections(page?.content) : defaultSections)
  }, [page, open])

  function update<K extends keyof HomeSections>(key: K, patch: Partial<HomeSections[K]>) {
    setSections((prev) => ({ ...prev, [key]: { ...(prev[key] as any), ...(patch as any) } }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // For Home page, serialize sections into content JSON (no API changes needed)
    const payload = {
      title,
      path,
      visible,
      seoTitle,
      seoDescription,
      content: path === "/" ? JSON.stringify(sections) : content,
    }

    try {
      const res = await fetch(page ? `/api/pages/${page.id}` : "/api/pages", {
        method: page ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Save failed")
      }
      const saved = (await res.json()) as Page
      // Inform the list to refresh
      window.dispatchEvent(new CustomEvent("pages:changed"))
      toast({ title: "Saved", description: `${saved.title}` })
      onSaved?.(saved)
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const isHome = path === "/"
  const defaultTab = isHome ? "home" : "basics"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="px-5 pt-4 text-base">{page ? "Edit Page" : "New Page"}</DialogTitle>
        </DialogHeader>

        {/* The form wraps the entire content to ensure Save submits reliably */}
        <form id="page-form" onSubmit={handleSubmit} className="max-h-[70vh] overflow-auto px-5 pb-2">
          <Tabs defaultValue={defaultTab} value={defaultTab}>
            <TabsList className="mb-3">
              <TabsTrigger value="basics" className="text-xs px-3 py-1.5">
                Basics
              </TabsTrigger>
              <TabsTrigger value="home" className="text-xs px-3 py-1.5" disabled={!isHome}>
                Homepage
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="m-0">
              <div className="grid gap-3">
                <div className="grid gap-1.5 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="title" className="text-xs">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="path" className="text-xs">
                      Path
                    </Label>
                    <Input
                      id="path"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      required
                      placeholder="/about"
                      className="h-8 text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">Unique path (e.g. "/", "/about").</p>
                  </div>
                </div>

                <div className="grid gap-1.5 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="seoTitle" className="text-xs">
                      SEO Title
                    </Label>
                    <Input
                      id="seoTitle"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="seoDescription" className="text-xs">
                      SEO Description
                    </Label>
                    <Input
                      id="seoDescription"
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {!isHome && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="content" className="text-xs">
                      Content
                    </Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Markdown or plain text content"
                      rows={4}
                      className="text-sm"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Switch checked={visible} onCheckedChange={setVisible} id="visible" />
                  <Label htmlFor="visible" className="text-xs">
                    Shown
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="home" className="m-0">
              <div className="grid gap-4">
                {/* Hero */}
                <div className="grid gap-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sections.hero.shown}
                      onCheckedChange={(v) => update("hero", { shown: v })}
                      id="hero-visible"
                    />
                    <Label htmlFor="hero-visible" className="text-xs">
                      Show Hero
                    </Label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Hero title"
                      value={sections.hero.title}
                      onChange={(e) => update("hero", { title: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Hero subtitle"
                      value={sections.hero.subtitle}
                      onChange={(e) => update("hero", { subtitle: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Primary CTA label"
                      value={sections.hero.primaryLabel}
                      onChange={(e) => update("hero", { primaryLabel: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Primary CTA href"
                      value={sections.hero.primaryHref}
                      onChange={(e) => update("hero", { primaryHref: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Secondary CTA label"
                      value={sections.hero.secondaryLabel}
                      onChange={(e) => update("hero", { secondaryLabel: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Secondary CTA href"
                      value={sections.hero.secondaryHref}
                      onChange={(e) => update("hero", { secondaryHref: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <ImagePicker
                    label="Hero image"
                    value={sections.hero.image}
                    onChange={(dataUrl) => update("hero", { image: dataUrl })}
                    aspect="4 / 3"
                  />
                </div>

                {/* About */}
                <div className="grid gap-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sections.about.shown}
                      onCheckedChange={(v) => update("about", { shown: v })}
                      id="about-visible"
                    />
                    <Label htmlFor="about-visible" className="text-xs">
                      Show About
                    </Label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="About title"
                      value={sections.about.title}
                      onChange={(e) => update("about", { title: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <Textarea
                      placeholder="About description"
                      value={sections.about.description}
                      onChange={(e) => update("about", { description: e.target.value })}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <ImagePicker
                    label="About image"
                    value={sections.about.image}
                    onChange={(dataUrl) => update("about", { image: dataUrl })}
                    aspect="16 / 9"
                  />
                </div>

                {/* Footer CTA */}
                <div className="grid gap-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sections.footerCta.shown}
                      onCheckedChange={(v) => update("footerCta", { shown: v })}
                      id="cta-visible"
                    />
                    <Label htmlFor="cta-visible" className="text-xs">
                      Show Create’N’Order CTA
                    </Label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="CTA title"
                      value={sections.footerCta.title}
                      onChange={(e) => update("footerCta", { title: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="CTA subtitle"
                      value={sections.footerCta.subtitle}
                      onChange={(e) => update("footerCta", { subtitle: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <Textarea
                    placeholder="CTA body"
                    value={sections.footerCta.body || ""}
                    onChange={(e) => update("footerCta", { body: e.target.value })}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Button label"
                      value={sections.footerCta.buttonLabel}
                      onChange={(e) => update("footerCta", { buttonLabel: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Button href"
                      value={sections.footerCta.buttonHref}
                      onChange={(e) => update("footerCta", { buttonHref: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>

        {/* Sticky action bar outside, but submits the form by id to ensure reliability */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background px-5 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => window.dispatchEvent(new Event("dummy"))}>
            Preview
          </Button>
          <Button type="submit" form="page-form" size="sm">
            {page ? "Save Changes" : "Create Page"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PageForm
