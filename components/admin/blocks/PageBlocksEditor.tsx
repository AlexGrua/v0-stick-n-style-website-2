"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUp, ArrowDown, Save, Send, Plus, Trash2, Upload, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BlockRegistry } from "@/lib/blocks/registry"
import { getAllowedTypes } from "@/lib/blocks/allowed"
import { BlockRenderer } from "@/components/blocks/renderer"

type Block = {
  id: number
  type: string
  props: any
  position: number
  is_active: boolean
  slot: string
}

type PageBlocksEditorProps = {
  pageKey: string
}

export function PageBlocksEditor({ pageKey }: PageBlocksEditorProps) {
  const { toast } = useToast()
  const [blocks, setBlocks] = React.useState<Block[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [activeBlock, setActiveBlock] = React.useState<Block | null>(null)
  const [dirty, setDirty] = React.useState(false)

  // Load blocks on mount
  React.useEffect(() => {
    loadBlocks()
  }, [pageKey])

  async function loadBlocks() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pages/${pageKey}/blocks?draft=1`, { 
        cache: 'no-store',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        const sortedBlocks = (data.blocks || []).sort((a: Block, b: Block) => a.position - b.position)
        setBlocks(sortedBlocks)
      } else {
        console.error('Failed to load blocks:', res.status, res.statusText)
        toast({ title: "Error", description: "Failed to load blocks", variant: "destructive" })
      }
    } catch (error) {
      console.error('Failed to load blocks:', error)
      toast({ title: "Error", description: "Failed to load blocks", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function markDirty() {
    setDirty(true)
  }

  function updateBlock(id: number, patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b
        const updatedBlock = { ...b, ...patch }
        // Update active block if it's the one being edited
        if (activeBlock?.id === id) {
          setActiveBlock(updatedBlock)
        }
        return updatedBlock
      }),
    )
    markDirty()
  }

  function moveBlock(id: number, dir: "up" | "down") {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx === -1) return prev
      const j = dir === "up" ? idx - 1 : idx + 1
      if (j < 0 || j >= prev.length) return prev
      const copy = prev.slice()
      const [it] = copy.splice(idx, 1)
      copy.splice(j, 0, it)
      // normalize positions
      return copy.map((b, i) => ({ ...b, position: i * 10 }))
    })
    markDirty()
  }

  async function saveDraft() {
    setSaving(true)
    try {
      const res = await fetch(`/api/pages/${pageKey}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Add credentials for auth
        body: JSON.stringify({ blocks }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to save: ${res.status} ${res.statusText}`)
      }

      toast({ title: "Saved", description: "Draft saved successfully" })
      setDirty(false)
    } catch (error) {
      console.error('Failed to save:', error)
      toast({ title: "Error", description: "Failed to save draft", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    setSaving(true)
    try {
      const res = await fetch(`/api/pages/${pageKey}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Add credentials for auth
        body: JSON.stringify({ blocks }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to publish: ${res.status} ${res.statusText}`)
      }

      toast({ title: "Published", description: "Page published successfully" })
      setDirty(false)
    } catch (error) {
      console.error('Failed to publish:', error)
      toast({ title: "Error", description: "Failed to publish", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  function openPreview() {
    const url = `/${pageKey}?newblocks=1&draft=1`
    window.open(url, '_blank')
  }

  function closeEditor() {
    setActiveBlock(null)
  }

  const allowedTypes = getAllowedTypes(pageKey)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading blocks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize">{pageKey} Page Editor</h1>
          <p className="text-sm text-muted-foreground">
            Edit blocks and their content. Save draft to preview changes, publish to go live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openPreview}>
            Preview
          </Button>
          <Button 
            onClick={saveDraft} 
            disabled={saving || !dirty}
            variant="outline"
          >
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button 
            onClick={publish} 
            disabled={saving}
          >
            {saving ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel - Block list */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {blocks.map((block, index) => {
                  const entry = (BlockRegistry as any)[block.type]
                  const canEdit = Boolean(entry?.schema)
                  
                  return (
                    <div key={block.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                             <div className="flex-1">
                         <div className="font-medium capitalize">{block.type}</div>
                         <div className="text-sm text-muted-foreground">
                           Position: {block.position} | Active: {block.is_active ? "Yes" : "No"} | Slot: {block.slot || 'main'}
                         </div>
                       </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveBlock(block.id, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveBlock(block.id, "down")}
                          disabled={index === blocks.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveBlock(block)}
                          disabled={!canEdit}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {blocks.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No blocks found. Blocks will appear here after they are created.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <BlockRenderer blocks={blocks} wrapperClass="block-renderer" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Block editor */}
        {activeBlock && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Edit {activeBlock.type}</CardTitle>
                <Button variant="ghost" size="sm" onClick={closeEditor}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BlockEditorForm 
                block={activeBlock} 
                onUpdate={(patch) => updateBlock(activeBlock.id, patch)}
                onClose={closeEditor}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Block Editor Form Component
function BlockEditorForm({ 
  block, 
  onUpdate, 
  onClose 
}: { 
  block: Block
  onUpdate: (patch: Partial<Block>) => void
  onClose: () => void
}) {
  const entry = (BlockRegistry as any)[block.type]
  const schema = entry?.schema

  if (!schema) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No schema available for this block type.
      </div>
    )
  }

  // For now, create a simple form based on schema
  // This will be enhanced with react-hook-form and zodResolver
  return (
    <div className="space-y-4">
             {/* Active toggle */}
       <div className="flex items-center space-x-2">
         <Switch
           id="active"
           checked={block.is_active}
           onCheckedChange={(checked) => onUpdate({ is_active: checked })}
         />
         <Label htmlFor="active">Visible</Label>
       </div>

               {/* Slot selector */}
        <div className="space-y-2">
          <Label htmlFor="slot">Slot</Label>
          <Select
            value={block.slot || 'left'}
            onValueChange={(value) => onUpdate({ slot: value })}
            disabled={block.type === 'contactsHero'}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Top — над колонками, Left — левая колонка, Right — правая
          </p>
        </div>

      {/* Simple form for block props */}
      <div className="space-y-4">
        {Object.keys(block.props || {}).map((key) => {
          const value = block.props[key]
          const isString = typeof value === 'string'
          const isBoolean = typeof value === 'boolean'
          const isNumber = typeof value === 'number'

          if (isBoolean) {
            return (
              <div key={key} className="flex items-center space-x-2">
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => 
                    onUpdate({ 
                      props: { ...block.props, [key]: checked } 
                    })
                  }
                />
                <Label htmlFor={key} className="capitalize">{key}</Label>
              </div>
            )
          }

          if (isNumber) {
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="capitalize">{key}</Label>
                <Input
                  id={key}
                  type="number"
                  value={value}
                  onChange={(e) => 
                    onUpdate({ 
                      props: { ...block.props, [key]: Number(e.target.value) } 
                    })
                  }
                />
              </div>
            )
          }

          // Default to text input
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="capitalize">{key}</Label>
              {isString && value.length > 100 ? (
                <Textarea
                  id={key}
                  value={value}
                  onChange={(e) => 
                    onUpdate({ 
                      props: { ...block.props, [key]: e.target.value } 
                    })
                  }
                  rows={4}
                />
              ) : (
                <Input
                  id={key}
                  value={value}
                  onChange={(e) => 
                    onUpdate({ 
                      props: { ...block.props, [key]: e.target.value } 
                    })
                  }
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Special handling for contactChannels */}
      {block.type === 'contactChannels' && (
        <ContactChannelsEditor 
          value={block.props.items || []}
          onChange={(items) => onUpdate({ props: { ...block.props, items } })}
        />
      )}
    </div>
  )
}

// Special editor for contactChannels
function ContactChannelsEditor({ 
  value, 
  onChange 
}: { 
  value: any[]
  onChange: (items: any[]) => void
}) {
  const addItem = () => {
    const newItem = {
      iconKey: 'email',
      label: '',
      value: '',
      href: '',
      visible: true
    }
    onChange([...value, newItem])
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, patch: any) => {
    const newItems = [...value]
    newItems[index] = { ...newItems[index], ...patch }
    onChange(newItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Contact Channels</Label>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" />
          Add Channel
        </Button>
      </div>

      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Channel {index + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

                         <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
                 <Label>Popular Icons</Label>
                 <Select
                   value={item.iconKey || ''}
                   onValueChange={(val) => updateItem(index, { iconKey: val })}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Choose icon..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="email">Email</SelectItem>
                     <SelectItem value="phone">Phone</SelectItem>
                     <SelectItem value="telegram">Telegram</SelectItem>
                     <SelectItem value="whatsapp">WhatsApp</SelectItem>
                     <SelectItem value="instagram">Instagram</SelectItem>
                     <SelectItem value="wechat">WeChat</SelectItem>
                     <SelectItem value="viber">Viber</SelectItem>
                     <SelectItem value="vk">VK</SelectItem>
                     <SelectItem value="skype">Skype</SelectItem>
                     <SelectItem value="linkedin">LinkedIn</SelectItem>
                     <SelectItem value="facebook">Facebook</SelectItem>
                     <SelectItem value="twitter">Twitter</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={item.label}
                  onChange={(e) => updateItem(index, { label: e.target.value })}
                  placeholder="Email"
                />
              </div>
            </div>

                         <div className="space-y-2">
               <Label>Custom Icon Key (optional)</Label>
               <Input
                 value={item.iconKey || ''}
                 onChange={(e) => updateItem(index, { iconKey: e.target.value })}
                 placeholder="custom-icon-name"
               />
               <p className="text-xs text-muted-foreground">
                 Если нужной иконки нет в списке выше, введите её ключ
               </p>
             </div>

             <div className="space-y-2">
               <Label>Value</Label>
               <Input
                 value={item.value}
                 onChange={(e) => updateItem(index, { value: e.target.value })}
                 placeholder="hello@example.com"
               />
             </div>

            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input
                value={item.href}
                onChange={(e) => updateItem(index, { href: e.target.value })}
                placeholder="mailto:hello@example.com"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id={`visible-${index}`}
                checked={item.visible}
                onCheckedChange={(checked) => updateItem(index, { visible: checked })}
              />
              <Label htmlFor={`visible-${index}`}>Visible</Label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
