"use client"

import * as React from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { uploadImage } from "@/lib/image-upload"

type MediaItem = {
  id: string
  url: string
  alt?: string
  createdAt: string
}

export function MediaLibrary({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onPick: (m: MediaItem) => void
}) {
  const [items, setItems] = React.useState<MediaItem[]>([])
  const [uploading, setUploading] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    ;(async () => {
      const res = await fetch("/api/admin/media", { cache: "no-store" })
      if (res.ok) {
        const data = (await res.json()) as { items: MediaItem[] }
        setItems(data.items || [])
      }
    })()
  }, [open])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      console.log("[v0] Uploading file to media library:", file.name)
      const permanentUrl = await uploadImage(file)

      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: permanentUrl, alt: file.name, size: file.size }),
      })

      if (res.ok) {
        const item = (await res.json()) as MediaItem
        setItems((prev) => [item, ...prev])
        console.log("[v0] File uploaded to media library successfully")
      }
    } catch (error) {
      console.error("[v0] Media library upload failed:", error)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2">
            <Input type="file" accept="image/*" onChange={onFile} disabled={uploading} />
            <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Upload image"}</span>
          </label>
        </div>
        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3 md:grid-cols-4">
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              className="group rounded border text-left"
              onClick={() => {
                onPick(m)
                onOpenChange(false)
              }}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded">
                <Image src={m.url || "/placeholder.svg"} alt={m.alt || "media"} fill className="object-cover" />
              </div>
              <div className="truncate p-2 text-xs text-muted-foreground group-hover:text-foreground">{m.alt}</div>
            </button>
          ))}
          {items.length === 0 && <div className="p-4 text-sm text-muted-foreground">No media yet</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
