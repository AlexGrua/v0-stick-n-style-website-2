"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { GripVertical, Plus, Trash2 } from "lucide-react"

interface NavigationItem {
  id: string
  label: string
  href: string
  visible: boolean
  order: number
  type: "link" | "button"
  icon?: string
  className?: string
}

interface NavigationData {
  mainMenu: NavigationItem[]
  showLanguageSwitcher: boolean
  showLoginButton: boolean
  showCartButton: boolean
}

const defaultNavigationItems: NavigationItem[] = [
  { id: "home", href: "/", label: "Home", visible: true, order: 1, type: "link" },
  { id: "about", href: "/about", label: "About us", visible: true, order: 2, type: "link" },
  { id: "catalog", href: "/catalog", label: "Catalog", visible: true, order: 3, type: "link" },
  { id: "faqs", href: "/faqs", label: "FAQs", visible: true, order: 4, type: "link" },
  { id: "contact", href: "/contact", label: "Contact Us", visible: true, order: 5, type: "link" },
  {
    id: "create-order",
    href: "/create-n-order",
    label: "Create'N'Order",
    visible: true,
    order: 6,
    type: "button",
    className: "bg-orange-500 hover:bg-orange-600 text-white",
  },
]

export default function NavigationPage() {
  const [data, setData] = useState<NavigationData>({
    mainMenu: defaultNavigationItems,
    showLanguageSwitcher: true,
    showLoginButton: true,
    showCartButton: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch("/api/site-settings/navigation")
      if (response.ok) {
        const result = await response.json()
        const loadedData = result.data || {}
        setData({
          mainMenu: loadedData.mainMenu || defaultNavigationItems,
          showLanguageSwitcher: loadedData.showLanguageSwitcher ?? true,
          showLoginButton: loadedData.showLoginButton ?? true,
          showCartButton: loadedData.showCartButton ?? true,
        })
      }
    } catch (error) {
      console.error("Error loading navigation:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveData = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/site-settings/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        console.log("Navigation saved successfully")
      }
    } catch (error) {
      console.error("Error saving navigation:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(data.mainMenu)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }))

    setData({ ...data, mainMenu: updatedItems })
  }

  const addMenuItem = () => {
    const newItem: NavigationItem = {
      id: `custom-${Date.now()}`,
      label: "New Page",
      href: "/new-page",
      order: data.mainMenu.length + 1,
      visible: true,
      type: "link",
    }
    setData({ ...data, mainMenu: [...data.mainMenu, newItem] })
  }

  const removeMenuItem = (index: number) => {
    const updatedMenu = data.mainMenu.filter((_, i) => i !== index)
    setData({ ...data, mainMenu: updatedMenu })
  }

  const updateMenuItem = (index: number, field: keyof NavigationItem, value: any) => {
    const updatedMenu = data.mainMenu.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setData({ ...data, mainMenu: updatedMenu })
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Navigation Settings</h1>
          <p className="text-muted-foreground">Manage site navigation and menu structure</p>
        </div>
        <Button onClick={saveData} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Main Menu</CardTitle>
            <CardDescription>
              Drag to reorder menu items. Changes will be reflected in the site header immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="menu-items">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {(data.mainMenu || []).map((item, index) => (
                      <Draggable key={item.id} draggableId={`item-${item.id}`} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-4 p-4 border rounded-lg bg-background"
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <Label>Label</Label>
                                <Input
                                  value={item.label}
                                  onChange={(e) => updateMenuItem(index, "label", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>URL</Label>
                                <Input
                                  value={item.href}
                                  onChange={(e) => updateMenuItem(index, "href", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={item.visible}
                                onCheckedChange={(checked) => updateMenuItem(index, "visible", checked)}
                              />
                              <Button variant="ghost" size="sm" onClick={() => removeMenuItem(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <Button onClick={addMenuItem} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Header Elements</CardTitle>
            <CardDescription>Control which elements appear in the site header</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Language Switcher</Label>
                <p className="text-sm text-muted-foreground">Show language selection dropdown</p>
              </div>
              <Switch
                checked={data.showLanguageSwitcher}
                onCheckedChange={(checked) => setData({ ...data, showLanguageSwitcher: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Login Button</Label>
                <p className="text-sm text-muted-foreground">Show user account/login button</p>
              </div>
              <Switch
                checked={data.showLoginButton}
                onCheckedChange={(checked) => setData({ ...data, showLoginButton: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Cart Button</Label>
                <p className="text-sm text-muted-foreground">Show shopping cart icon</p>
              </div>
              <Switch
                checked={data.showCartButton}
                onCheckedChange={(checked) => setData({ ...data, showCartButton: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
