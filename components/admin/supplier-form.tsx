"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import type { Supplier, SupplierStatus } from "@/lib/suppliers-store"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
  initial?: Partial<Supplier>
  categories: Category[]
  onSaved?: () => void
}

export function SupplierForm({ open, onOpenChange, supplier, initial, categories, onSaved }: Props) {
  const { toast } = useToast()
  const isEdit = !!supplier

  const [id, setId] = React.useState(initial?.id ?? supplier?.id ?? "")
  const [shortName, setShortName] = React.useState(initial?.shortName ?? supplier?.shortName ?? "")
  const [companyName, setCompanyName] = React.useState(initial?.companyName ?? supplier?.companyName ?? "")
  const [contactPerson, setContactPerson] = React.useState(initial?.contactPerson ?? supplier?.contactPerson ?? "")
  const [contactEmail, setContactEmail] = React.useState(initial?.contactEmail ?? supplier?.contactEmail ?? "")
  const [contactPhone, setContactPhone] = React.useState(initial?.contactPhone ?? supplier?.contactPhone ?? "")
  const [messenger, setMessenger] = React.useState(initial?.messenger ?? supplier?.messenger ?? "")
  const [website, setWebsite] = React.useState(initial?.website ?? supplier?.website ?? "")
  const [status, setStatus] = React.useState<SupplierStatus>(initial?.status ?? supplier?.status ?? "approved")
  const [notes, setNotes] = React.useState(initial?.notes ?? supplier?.notes ?? "")
  const [selectedCats, setSelectedCats] = React.useState<string[]>(initial?.categories ?? supplier?.categories ?? [])
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    setId(initial?.id ?? supplier?.id ?? "")
    setShortName(initial?.shortName ?? supplier?.shortName ?? "")
    setCompanyName(initial?.companyName ?? supplier?.companyName ?? "")
    setContactPerson(initial?.contactPerson ?? supplier?.contactPerson ?? "")
    setContactEmail(initial?.contactEmail ?? supplier?.contactEmail ?? "")
    setContactPhone(initial?.contactPhone ?? supplier?.contactPhone ?? "")
    setMessenger(initial?.messenger ?? supplier?.messenger ?? "")
    setWebsite(initial?.website ?? supplier?.website ?? "")
    setStatus((initial?.status as SupplierStatus) ?? (supplier?.status as SupplierStatus) ?? "approved")
    setNotes(initial?.notes ?? supplier?.notes ?? "")
    setSelectedCats(initial?.categories ?? supplier?.categories ?? [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier, initial, open])

  function toggleCat(slug: string, checked: boolean | string) {
    setSelectedCats((prev) => {
      const has = prev.includes(slug)
      if (checked && !has) return [...prev, slug]
      if (!checked && has) return prev.filter((c) => c !== slug)
      return prev
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id && !isEdit) {
      toast({ title: "ID is required", variant: "destructive" })
      return
    }
    if (!shortName || !companyName || !contactPerson || selectedCats.length === 0) {
      toast({
        title: "Fill all required fields",
        description: "ID, Short Name, Company, Contact, Categories",
        variant: "destructive",
      })
      return
    }
    setPending(true)
    try {
      const payload: Supplier = {
        id: isEdit ? supplier!.id : id.trim(),
        shortName: shortName.trim(),
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        messenger: messenger.trim() || undefined,
        website: website.trim() || undefined,
        status,
        categories: selectedCats,
        notes: notes.trim() || undefined,
      }
      let res: Response
      if (isEdit) {
        res = await fetch(`/api/suppliers/${supplier!.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || "Save failed")
      }
      toast({ title: isEdit ? "Supplier updated" : "Supplier created" })
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      toast({ title: "Error", description: String(e.message || e), variant: "destructive" })
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Supplier" : "New Supplier"}</DialogTitle>
          <DialogDescription>Fill the required fields and save your changes.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sup-id">
                ID <span className="text-red-600">*</span>
              </Label>
              <Input
                id="sup-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="P1"
                disabled={isEdit}
                required={!isEdit}
              />
              <p className="text-xs text-muted-foreground">{"Allowed: letters, numbers, - and _"}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-short">
                Short Name <span className="text-red-600">*</span>
              </Label>
              <Input id="sup-short" value={shortName} onChange={(e) => setShortName(e.target.value)} required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="sup-company">
                Company Name <span className="text-red-600">*</span>
              </Label>
              <Input id="sup-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-contact">
                Contact person <span className="text-red-600">*</span>
              </Label>
              <Input
                id="sup-contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SupplierStatus)}>
                <SelectTrigger id="sup-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">approved</SelectItem>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="blocked">blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-email">Email</Label>
              <Input
                id="sup-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-phone">Phone</Label>
              <Input id="sup-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-web">Website</Label>
              <Input
                id="sup-web"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="sup-msg">Messenger</Label>
              <Input
                id="sup-msg"
                value={messenger}
                onChange={(e) => setMessenger(e.target.value)}
                placeholder="WeChat/WhatsApp/etc."
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>
              Categories <span className="text-red-600">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {categories.map((c) => (
                <label key={c.id} className={cn("flex items-center gap-2 rounded-md border p-2 text-sm")}>
                  <Checkbox
                    checked={selectedCats.includes(c.slug)}
                    onCheckedChange={(checked) => toggleCat(c.slug, checked)}
                    aria-label={`Category ${c.name}`}
                  />
                  <span className="truncate">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sup-notes">Notes</Label>
            <Textarea id="sup-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
