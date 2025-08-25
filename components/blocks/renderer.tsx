"use client"

import { useEffect, useState } from "react"
import { BlockRegistry } from "@/lib/blocks/registry"

interface BlockRendererProps {
  pageKey?: string
  blocks?: Array<{ id: number; type: string; props: any }>
  wrapperClass?: string
}

export function BlockRenderer({ pageKey, blocks, wrapperClass = "block-renderer" }: BlockRendererProps) {
  const [pageBlocks, setPageBlocks] = useState(blocks || [])
  const [loading, setLoading] = useState(!blocks)

  useEffect(() => {
    if (!blocks && pageKey) {
      loadBlocks()
    }
  }, [pageKey, blocks])

  async function loadBlocks() {
    if (!pageKey) return
    
    try {
      console.log(`[BlockRenderer] Loading blocks for page: ${pageKey}`)
      const response = await fetch(`/api/pages/${pageKey}/blocks`)
      if (response.ok) {
        const data = await response.json()
        console.log(`[BlockRenderer] Loaded blocks:`, data.blocks)
        setPageBlocks(data.blocks || [])
      } else {
        console.error(`[BlockRenderer] Failed to load blocks:`, response.status, response.statusText)
      }
    } catch (error) {
      console.error(`[BlockRenderer] Failed to load blocks for ${pageKey}:`, error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading blocks...</div>
  }

  if (!pageBlocks?.length) {
    console.warn('[BlockRenderer] no blocks to render')
    return null
  }

  console.log(`[BlockRenderer] Rendering ${pageBlocks.length} blocks`)

  return (
    <div className={wrapperClass}>
      {pageBlocks.map((b) => {
        console.log(`[BlockRenderer] Rendering block: ${b.type}`)
        const entry = (BlockRegistry as any)[b.type]
        if (!entry) {
          console.warn(`[BlockRenderer] unknown block type: ${b.type}`)
          return null
        }
        const Cmp = entry.component
        try {
          return <Cmp key={b.id} {...b.props} />
        } catch (e) {
          console.error(`[BlockRenderer] render error in ${b.type}:`, e)
          return null
        }
      })}
    </div>
  )
}


