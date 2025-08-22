"use client"

import { useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { Container } from "@/lib/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  capacityKg: z.coerce.number().min(0),
  capacityM3: z.coerce.number().min(0),
  visible: z.boolean().default(true),
})
type FormValues = z.infer<typeof schema>
type ContainerEx = Container & { visible?: boolean }

export function ContainerForm({
  open,
  onOpenChange,
  container,
}: { open: boolean; onOpenChange: (v: boolean) => void; container: ContainerEx | null }) {
  const qc = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", capacityKg: 0, capacityM3: 0, visible: true }, // default visible: true
  })

  useEffect(() => {
    if (container) {
      form.reset({
        id: (container as any).id,
        name: container.name,
        code: container.code,
        capacityKg: (container as any).capacityKg,
        capacityM3: (container as any).capacityM3,
        visible: container.visible ?? true, // treat undefined as true
      })
    } else {
      form.reset({ name: "", code: "", capacityKg: 0, capacityM3: 0, visible: true })
    }
  }, [container])

  const mut = useMutation({
    mutationFn: async (values: FormValues) => {
      const method = values.id ? "PUT" : "POST"
      const url = values.id ? `/api/containers/${values.id}` : "/api/containers"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Save failed")
      return await res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["containers"] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{container ? "Edit Container" : "New Container"}</DialogTitle>
        </DialogHeader>

        <form className="grid gap-3" onSubmit={form.handleSubmit((v) => mut.mutate(v))}>
          <div className="grid gap-1">
            <Label>Name</Label>
            <Input {...form.register("name")} required placeholder={`e.g., 20'`} className="h-9" />
          </div>
          <div className="grid gap-1">
            <Label>Code</Label>
            <Input {...form.register("code")} required placeholder="e.g., 20" className="h-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Capacity KG</Label>
              <Input
                type="number"
                step="1"
                {...form.register("capacityKg", { valueAsNumber: true })}
                min={0}
                className="h-9"
              />
            </div>
            <div className="grid gap-1">
              <Label>Capacity m³</Label>
              <Input
                type="number"
                step="0.1"
                {...form.register("capacityM3", { valueAsNumber: true })}
                min={0}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded border p-3">
            <div className="space-y-0.5">
              <Label className="font-medium">Visible</Label>
              <p className="text-xs text-muted-foreground">Make this container available for selection</p>
            </div>
            <Switch
              checked={form.watch("visible") ?? true} // default true
              onCheckedChange={(v) => form.setValue("visible", v, { shouldDirty: true })}
              aria-label="Make visible"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
