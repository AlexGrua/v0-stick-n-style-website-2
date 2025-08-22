"use client"

import { useEffect, useState } from "react"
import { useLang } from "@/lib/i18n"

export type ContentDict = Record<string, string>

export function useContentTranslations(entityType: "page" | "product", entityId: string | undefined) {
  const lang = useLang()
  const [dict, setDict] = useState<ContentDict>({})

  useEffect(() => {
    let cancelled = false
    if (!entityId) {
      setDict({})
      return
    }
    ;(async () => {
      try {
        const url = `/api/translations/content?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(
          entityId,
        )}`
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) {
          if (!cancelled) setDict({})
          return
        }
        const data = await res.json()
        const raw = (data?.data?.translations || {}) as Record<string, Record<string, { value: string }>>
        const out: ContentDict = {}
        for (const key of Object.keys(raw)) {
          const v = raw[key]?.[lang]?.value || raw[key]?.["en"]?.value
          if (typeof v === "string") out[key] = v
        }
        if (!cancelled) setDict(out)
      } catch {
        if (!cancelled) setDict({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [entityType, entityId, lang])

  return { lang, dict }
}