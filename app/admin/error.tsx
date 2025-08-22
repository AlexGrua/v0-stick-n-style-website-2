"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type AdminErrorProps = {
  error?: (Error & { digest?: string }) | null
  reset?: (() => void) | null
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  const router = useRouter()

  const handleTryAgain = () => {
    // Prefer Next.js provided reset() when available
    if (typeof reset === "function") {
      try {
        reset()
        return
      } catch {
        // fall through to refresh/reload
      }
    }
    // Fallbacks for environments where reset isn't provided
    try {
      router.refresh()
    } catch {
      if (typeof window !== "undefined") {
        window.location.reload()
      }
    }
  }

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    } else {
      try {
        router.refresh()
      } catch {
        // no-op
      }
    }
  }

  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <div className="max-w-xl rounded-lg border bg-background p-6">
        <h2 className="mb-2 text-xl font-semibold">Something went wrong in Admin</h2>
        <p className="text-sm text-muted-foreground break-words">
          {error?.message || "Unknown error"}
          {error && "digest" in error && error.digest ? ` (digest: ${error.digest})` : null}
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleTryAgain}>Try again</Button>
          <Button variant="outline" onClick={handleReload}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  )
}
