"use client"

import { useState, useEffect, useCallback } from "react"
import type { HomePageData } from "@/lib/types"

export function useHomePageData() {
  const [data, setData] = useState<HomePageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/home-page")
        if (response.ok) {
          const homePageData = await response.json()
          setData(homePageData)
        }
      } catch (error) {
        console.error("[v0] Failed to load home page data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Save specific block data
  const saveBlock = useCallback(
    async (blockType: string, blockData: any) => {
      if (!data) return

      setSaving(true)
      try {
        const response = await fetch("/api/home-page", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ blockType, blockData }),
        })

        if (response.ok) {
          const updatedData = await response.json()
          setData(updatedData)
          console.log("[v0] Block saved successfully:", blockType)
        }
      } catch (error) {
        console.error("[v0] Failed to save block:", error)
      } finally {
        setSaving(false)
      }
    },
    [data],
  )

  // Save all data
  const saveAll = useCallback(async (newData: HomePageData) => {
    setSaving(true)
    try {
      const response = await fetch("/api/home-page", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setData(updatedData)
        console.log("[v0] All data saved successfully")
      }
    } catch (error) {
      console.error("[v0] Failed to save all data:", error)
    } finally {
      setSaving(false)
    }
  }, [])

  // Auto-save with debounce
  const autoSave = useCallback(
    debounce((blockType: string, blockData: any) => {
      saveBlock(blockType, blockData)
    }, 1000),
    [saveBlock],
  )

  return {
    data,
    loading,
    saving,
    saveBlock,
    saveAll,
    autoSave,
    setData,
  }
}

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
