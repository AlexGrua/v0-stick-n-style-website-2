"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

type LangCode = "en" | "es" | "ru" | "cn"

const LANGS: { code: LangCode; short: string; native: string }[] = [
  { code: "en", short: "ENG", native: "English" },
  { code: "es", short: "ESP", native: "Español" },
  { code: "ru", short: "РУС", native: "Русский" },
  { code: "cn", short: "中文", native: "中文" },
]

// Map to your crisp puzzle SVGs
const PUZZLE_SRC: Record<LangCode, string> = {
  en: "/images/lang/puzzle-flag-english.svg",
  es: "/images/lang/puzzle-flag-spanish.svg",
  ru: "/images/lang/puzzle-flag-russian.svg",
  cn: "/images/lang/puzzle-flag-chinese.svg",
}

// Persist language (cookie + localStorage)
function getInitialLang(): LangCode {
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(?:^|; )lang=([^;]+)/)
    if (m) {
      const v = decodeURIComponent(m[1])
      if (v === "en" || v === "es" || v === "ru" || v === "cn") return v
    }
  }
  if (typeof window !== "undefined") {
    const v = window.localStorage.getItem("lang")
    if (v === "en" || v === "es" || v === "ru" || v === "cn") return v as LangCode
  }
  return "en"
}
function setLang(code: LangCode) {
  if (typeof document !== "undefined") {
    document.cookie = `lang=${encodeURIComponent(code)}; path=/; max-age=31536000; samesite=lax`
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem("lang", code)
  }
}

function PuzzleImg({
  code,
  size = 60,
  className,
  alt,
}: {
  code: LangCode
  size?: number
  className?: string
  alt?: string
}) {
  const src = PUZZLE_SRC[code]
  return (
    <img
      src={src || "/placeholder.svg"}
      alt={alt ?? code}
      width={size}
      height={size}
      decoding="async"
      loading="eager"
      draggable={false}
      className={cn("block select-none pointer-events-none", className)}
      style={{
        width: size,
        height: size,
        imageRendering: "auto",
      }}
    />
  )
}

export function LanguageSwitcher({
  mode = "menu",
  className,
  puzzleSize = 60, // header puzzle size inside 64x64 ghost button
  dropdownIconSize = 48,
  listIconSize = 48,
}: {
  mode?: "menu" | "list"
  className?: string
  puzzleSize?: number
  dropdownIconSize?: number
  listIconSize?: number
}) {
  const [lang, setLangState] = React.useState<LangCode>(getInitialLang)

  const apply = (code: LangCode) => {
    setLang(code)
    setLangState(code)
  }

  if (mode === "list") {
    // Mobile inline selector
    return (
      <div className={cn("space-y-3", className)}>
        <div className="text-sm font-medium">Language</div>
        <RadioGroup value={lang} onValueChange={(v) => apply(v as LangCode)} className="grid grid-cols-2 gap-3">
          {LANGS.map((l) => (
            <label
              key={l.code}
              htmlFor={`lang-${l.code}`}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border bg-white px-3 py-2",
                l.code === lang && "border-foreground/30",
              )}
            >
              <PuzzleImg code={l.code} size={listIconSize} alt={l.native} />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{l.short}</span>
                <span className="text-sm text-muted-foreground">{l.native}</span>
              </div>
              <span className="ml-auto">
                <RadioGroupItem id={`lang-${l.code}`} value={l.code} />
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>
    )
  }

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* 64×64 ghost button like neighbors; puzzle image draws at full 60px (max) */}
        <Button variant="ghost" size="icon" aria-label="Change language" className={cn("h-16 w-16 p-0", className)}>
          <PuzzleImg code={lang} size={puzzleSize} alt={current.native} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => apply(l.code)}
            className={cn("flex items-center gap-3", lang === l.code && "bg-muted")}
          >
            <PuzzleImg code={l.code} size={dropdownIconSize} alt={l.native} />
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-sm font-semibold">{l.short}</span>
              <span className="truncate text-sm text-muted-foreground">{l.native}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSwitcher
