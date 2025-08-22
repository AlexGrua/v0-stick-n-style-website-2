"use client"

import * as React from "react"
import type { CartItem } from "@/lib/cart"
import { EditItemDialog } from "./edit-item-dialog"
import { getRecentQtyChangeTs } from "@/lib/cart"

// Lightweight pub/sub to open the dialog from anywhere
type Subscriber = (item: CartItem) => void
const subscribers = new Set<Subscriber>()

let lastOpenTs = 0
let lastOpenKey = ""
let isDialogOpen = false

// Ensure only ONE portal instance is active in the app
let ownerToken: symbol | null = null

export function openEditCartItemDialog(item: CartItem) {
  const now = Date.now()

  // Ignore opens while a dialog is already open
  if (isDialogOpen) return

  // Ignore opens that occur right after a quantity change (rapid +/-)
  const qtyTs = typeof getRecentQtyChangeTs === "function" ? getRecentQtyChangeTs() : undefined
  if (qtyTs && now - qtyTs < 450) return

  const key = item.variantKey || [item.id, item.color || "", item.size || "", item.thickness || ""].join("__")
  // Debounce to avoid double-open on accidental double click
  if (key === lastOpenKey && now - lastOpenTs < 350) return
  lastOpenTs = now
  lastOpenKey = key
  subscribers.forEach((fn) => fn(item))
}

export function CartEditPortal() {
  const [open, setOpen] = React.useState(false)
  const [item, setItem] = React.useState<CartItem | null>(null)

  // Singleton owner arbitration (stable token per instance)
  const myTokenRef = React.useRef<symbol>(Symbol("cart-edit-portal"))
  const [isOwner, setIsOwner] = React.useState(false)

  // Claim ownership once on mount
  React.useEffect(() => {
    if (ownerToken === null) {
      ownerToken = myTokenRef.current
      setIsOwner(true)
    } else if (ownerToken === myTokenRef.current) {
      setIsOwner(true)
    } else {
      setIsOwner(false)
    }
    return () => {
      if (ownerToken === myTokenRef.current) {
        ownerToken = null
      }
    }
    // Deliberately run once for ownership claim
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the global "isDialogOpen" lock in sync with local state
  React.useEffect(() => {
    isDialogOpen = open
    return () => {
      // on unmount or when closing, ensure the flag isn't left true
      if (!open) isDialogOpen = false
    }
  }, [open])

  // Subscribe to open requests only if this instance is the owner
  React.useEffect(() => {
    if (!isOwner) return
    const onOpen: Subscriber = (incoming) => {
      setItem(incoming)
      setOpen(true)
    }
    subscribers.add(onOpen)
    return () => {
      subscribers.delete(onOpen)
    }
  }, [isOwner])

  const handleOpenChange = (v: boolean) => {
    if (!isOwner) return
    setOpen(v)
    if (!v) {
      // Close once and clear the selected item to avoid double-close UX
      setItem(null)
    }
  }

  // It's fine to render nothing if not the owner. Hooks above still ran in a fixed order.
  if (!isOwner) return null

  return <EditItemDialog open={open} item={item} onOpenChange={handleOpenChange} />
}
