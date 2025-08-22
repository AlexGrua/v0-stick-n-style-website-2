"use client"

import { useEffect } from "react"

// Unregister stale service workers in preview and auto-reload on chunk load errors.
export default function ServiceWorkerReset() {
  useEffect(() => {
    // Try to unregister any existing SW (helps with stale chunk references in previews)
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.allSettled(regs.map((r) => r.unregister())))
        .catch(() => void 0)
    }

    const onError = (e: Event | ErrorEvent) => {
      const msg = (e as ErrorEvent)?.message || (e as any)?.reason?.message || (e as any)?.toString?.() || ""
      if (typeof msg === "string" && msg.includes("Loading chunk")) {
        // Force a hard reload to fetch fresh chunks
        location.reload()
      }
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onError)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onError)
    }
  }, [])

  return null
}
