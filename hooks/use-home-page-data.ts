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
          console.log("[v0] Loaded home page data:", JSON.stringify(homePageData, null, 2))
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
      console.log("[v0] saveAll - starting save...")
      
      // Добавляем таймаут для операции сохранения
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд таймаут
      
      const response = await fetch("/api/home-page", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Save failed:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const updatedData = await response.json()
      setData(updatedData)
      console.log("[v0] All data saved successfully")
      return updatedData
    } catch (error) {
      console.error("[v0] Failed to save all data:", error)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Операция сохранения превысила время ожидания (30 секунд)")
      }
      throw error
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
