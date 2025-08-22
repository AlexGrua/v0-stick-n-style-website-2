"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import Image from "next/image"

type Language = {
  id: string
  code: string
  name: string
  native_name: string
  flag_icon: string
  is_active: boolean
  is_default: boolean
}

function getInitialLang() {
  // Placeholder function to get initial language
  return "en"
}

function setLang(code: string) {
  // Placeholder function to set language
  console.log("Setting language to:", code)
}

function FlagIcon({
  flag_icon,
  alt,
  size = 24,
  className,
}: {
  flag_icon: string
  alt: string
  size?: number
  className?: string
}) {
  // Check if it's a file path (SVG)
  if (flag_icon.startsWith("/") || flag_icon.includes(".svg") || flag_icon.includes(".png")) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full border-2 border-white shadow-lg ring-2 ring-gray-100 hover:ring-lime-400 transition-all duration-200",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src={flag_icon || "/placeholder.svg"}
          alt={alt}
          width={size}
          height={size}
          className="object-cover"
          onError={(e) => {
            // Fallback to gradient with country code if image fails to load
            const target = e.target as HTMLImageElement
            target.style.display = "none"
            const parent = target.parentElement
            if (parent) {
              const countryCode = alt.split(" ")[0].toUpperCase().slice(0, 2)
              parent.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center">
                  <span class="text-white font-bold text-xs">${countryCode}</span>
                </div>
              `
            }
          }}
        />
      </div>
    )
  }

  // Emoji flag with modern circular container
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-white shadow-lg ring-2 ring-gray-100 hover:ring-lime-400 transition-all duration-200 bg-gradient-to-br from-gray-50 to-gray-100",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: `${size * 0.6}px`, lineHeight: 1 }}>{flag_icon || "🌐"}</span>
    </div>
  )
}

export function LanguageSwitcher({
  mode = "menu",
  className,
  puzzleSize = 40,
  dropdownIconSize = 32,
  listIconSize = 28,
}: {
  mode?: "menu" | "list"
  className?: string
  puzzleSize?: number
  dropdownIconSize?: number
  listIconSize?: number
}) {
  const [languages, setLanguages] = React.useState<Language[]>([])
  const [lang, setLangState] = React.useState<string>(getInitialLang())
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadLanguages = async () => {
      try {
        console.log("[v0] Loading languages for switcher...")
        const response = await fetch("/api/languages")
        const result = await response.json()

        if (result.success && result.data) {
          const activeLanguages = result.data.filter((lang: Language) => lang.is_active)
          setLanguages(activeLanguages)
          console.log("[v0] Active languages loaded:", activeLanguages.length)

          // Set default language if current lang is not available
          const currentLangExists = activeLanguages.some((l: Language) => l.code === lang)
          if (!currentLangExists) {
            const defaultLang = activeLanguages.find((l: Language) => l.is_default) || activeLanguages[0]
            if (defaultLang) {
              setLangState(defaultLang.code)
              setLang(defaultLang.code)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error loading languages:", error)
      } finally {
        setLoading(false)
      }
    }

    loadLanguages()
  }, [lang])

  const apply = (code: string) => {
    setLang(code)
    setLangState(code)
    console.log("[v0] Language switched to:", code)
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className={cn("h-16 w-16 p-0", className)} disabled>
        <FlagIcon flag_icon="🌐" alt="Loading" size={puzzleSize} />
      </Button>
    )
  }

  if (languages.length === 0) {
    return null // Don't show switcher if no languages available
  }

  if (mode === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-sm font-semibold text-gray-700">Choose Language</div>
        <RadioGroup value={lang} onValueChange={(v) => apply(v)} className="grid grid-cols-1 gap-3">
          {languages.map((l) => (
            <label
              key={l.id}
              htmlFor={`lang-${l.code}`}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-xl border-2 bg-white px-4 py-3 hover:bg-gray-50 hover:border-lime-300 transition-all duration-200 shadow-sm",
                l.code === lang && "border-lime-500 bg-lime-50 shadow-md",
              )}
            >
              <FlagIcon flag_icon={l.flag_icon} alt={`${l.name} flag`} size={listIconSize} />
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-sm font-bold text-gray-900">{l.name}</span>
                <span className="text-xs text-gray-500">{l.native_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                  {l.code.toUpperCase()}
                </span>
                <RadioGroupItem id={`lang-${l.code}`} value={l.code} />
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>
    )
  }

  const current = languages.find((l) => l.code === lang) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Change language"
          className={cn(
            "h-16 w-16 p-0 hover:bg-lime-50 hover:scale-105 transition-all duration-200 rounded-full",
            className,
          )}
        >
          <FlagIcon
            flag_icon={current?.flag_icon || "🌐"}
            alt={`${current?.name || "Language"} flag`}
            size={puzzleSize}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-2 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <div className="space-y-1 py-1">
          {languages.map((l) => (
            <DropdownMenuItem
              key={l.id}
              onClick={() => apply(l.code)}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg hover:bg-lime-50 transition-all duration-200 cursor-pointer",
                lang === l.code && "bg-lime-100 border-2 border-lime-400 shadow-sm",
              )}
            >
              <FlagIcon flag_icon={l.flag_icon} alt={`${l.name} flag`} size={24} />
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="font-semibold text-sm text-gray-900">{l.name}</span>
                <span className="text-xs text-gray-500">{l.native_name}</span>
              </div>
              <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                {l.code.toUpperCase()}
              </span>
              {lang === l.code && <div className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse"></div>}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSwitcher
