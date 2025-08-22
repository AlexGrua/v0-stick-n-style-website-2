"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type LangCode = "en" | "ru" | "es" | "cn"

type UiDict = Record<string, string>

type I18nState = {
  lang: LangCode
  dict: UiDict
  setLang: (l: LangCode) => void
}

const I18nContext = createContext<I18nState | null>(null)

function getCookie(name: string) {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"))
  return m ? decodeURIComponent(m[1]) : null
}

function langAliases(lang: string): string[] {
  if (lang === "cn") return ["cn", "zh", "zh-CN", "zh_CN"]
  if (lang === "ru") return ["ru", "ru-RU", "ru_RU"]
  if (lang === "es") return ["es", "es-ES", "es_ES"]
  return [lang]
}

async function loadUiDict(lang: LangCode): Promise<UiDict> {
  try {
    const res = await fetch(`/api/translations/ui?ts=${Date.now()}` , { cache: "no-store" })
    if (!res.ok) return {}
    const data = await res.json()
    const raw = (data?.data?.translations || {}) as Record<string, Record<string, { value: string }>>
    const dict: UiDict = {}
    const candidates = langAliases(lang)
    for (const key of Object.keys(raw)) {
      let v: string | undefined
      for (const c of candidates) {
        const maybe = raw[key]?.[c]?.value
        if (typeof maybe === "string" && maybe.length > 0) {
          v = maybe
          break
        }
      }
      if (!v) v = raw[key]?.["en"]?.value
      if (v) dict[key] = v
    }
    return dict
  } catch {
    return {}
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>("en")
  const [dict, setDict] = useState<UiDict>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const d = await loadUiDict(lang)
      if (!cancelled) setDict(d)
    })()
    return () => {
      cancelled = true
    }
  }, [lang])

  useEffect(() => {
    // Set initial lang from cookie after mount to avoid hydration mismatch
    const cookieLang = (getCookie("lang") as LangCode) || "en"
    setLang(cookieLang)
    const handler = (e: any) => {
      const next = (e?.detail as LangCode) || (getCookie("lang") as LangCode) || "en"
      setLang(next)
    }
    window.addEventListener("lang:changed", handler as any)
    return () => window.removeEventListener("lang:changed", handler as any)
  }, [])

  const value = useMemo<I18nState>(() => ({ lang, dict, setLang }), [lang, dict])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) return (key: string, fallback?: string) => fallback || key
  const seen = (globalThis as any).__T_MISSING__ || ((globalThis as any).__T_MISSING__ = new Set<string>())
  return (key: string, fallback?: string) => {
    const hit = ctx.dict[key]
    if (typeof hit === "string" && hit.trim().length > 0) return hit
    // If translation exists but is an empty string, fall back to English to keep SSR/CSR consistent
    if (hit === "") return fallback || key
    const en = fallback || key
    // Report missing key once per session
    if (typeof window !== "undefined" && !seen.has(key)) {
      seen.add(key)
      fetch("/api/translations/ui/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, en }),
      }).catch(() => {})
    }
    return en
  }
}

export function useLang(): LangCode {
  const ctx = useContext(I18nContext)
  return (ctx?.lang || "en") as LangCode
}