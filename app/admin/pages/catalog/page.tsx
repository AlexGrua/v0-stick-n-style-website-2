"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { Plus, Trash2, Upload } from "lucide-react"
import type { CatalogPageData, CatalogContentBlock } from "@/lib/types"
import { uploadImage } from "@/lib/image-upload"

const defaultData: CatalogPageData = {
  title: "Catalog",
  description: "Browse our complete collection of premium panels and flooring",
  seoTitle: "Product Catalog - Stick'N'Style",
  seoDescription: "Explore our extensive catalog of 3D wall panels, flooring solutions, and adhesive products",
  heroTitle: "Premium Panels & Flooring Collection",
  heroSubtitle: "Discover innovative solutions for modern interiors",
  showHero: false,
  layout: {
    productsPerRow: 5,
    cardSize: "medium",
    showFilters: true,
    showSearch: true,
    showCategories: true,
    showLeftPanel: false,
  },
  filters: {
    enableCategoryFilter: true,
    enableSubcategoryFilter: true,
    enableSearch: true,
    enableSorting: false,
    sortOptions: ["name", "newest"],
  },
  contentBlocks: [],
  featuredCategories: [],
  showProductCount: false,
  showPagination: true,
  productsPerPage: 30,
  rowsPerPage: 6,
}

export default function CatalogPageAdmin() {
  const { toast } = useToast()
  const [data, setData] = useState<CatalogPageData>(defaultData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await fetch("/api/pages/catalog")
      if (res.ok) {
        const pageData = await res.json()
        if (pageData.content) {
          const parsed = JSON.parse(pageData.content)
          setData({ ...defaultData, ...parsed })
        }
      }
    } catch (error) {
      console.error("Failed to load catalog page data:", error)
    }
  }

  async function saveData() {
    setLoading(true)
    try {
      const res = await fetch("/api/pages/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          path: "/catalog",
          content: JSON.stringify(data),
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          visible: true,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast({ title: "Saved", description: "Catalog page updated successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function addContentBlock(type: "description" | "button" | "image") {
    const newBlock: CatalogContentBlock = {
      id: Date.now().toString(),
      type: type === "description" ? "text" : type === "button" ? "button" : "image",
      title: type === "description" ? "Description Block" : type === "button" ? "Button Block" : "Image Block",
      description: type === "description" ? "Enter your description here..." : "",
      buttonText: type === "button" ? "Click here" : "",
      link: type === "button" ? "#" : "",
      image: type === "image" ? "" : "",
      position: "after_products",
      visible: true,
      order: data.contentBlocks.length,
    }
    setData((prev) => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock],
    }))
  }

  function updateContentBlock(id: string, updates: Partial<CatalogContentBlock>) {
    setData((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block) => (block.id === id ? { ...block, ...updates } : block)),
    }))
  }

  function deleteContentBlock(id: string) {
    setData((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter((block) => block.id !== id),
    }))
  }

  async function handleImageUpload(file: File, blockId: string) {
    try {
      const imageUrl = await uploadImage(file)
      updateContentBlock(blockId, { image: imageUrl })
      toast({ title: "Success", description: "Image uploaded successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catalog Page</h1>
        <Button onClick={saveData} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="layout">Layout & Display</TabsTrigger>
          <TabsTrigger value="filters">Filters & Sorting</TabsTrigger>
          <TabsTrigger value="content">Content Blocks</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={data.seoTitle}
                    onChange={(e) => setData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={data.seoDescription}
                  onChange={(e) => setData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showHero"
                  checked={data.showHero}
                  onCheckedChange={(checked) => setData((prev) => ({ ...prev, showHero: checked }))}
                />
                <Label htmlFor="showHero">Show Hero Section</Label>
              </div>
              {data.showHero && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="heroTitle">Hero Title</Label>
                    <Input
                      id="heroTitle"
                      value={data.heroTitle}
                      onChange={(e) => setData((prev) => ({ ...prev, heroTitle: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                    <Textarea
                      id="heroSubtitle"
                      value={data.heroSubtitle}
                      onChange={(e) => setData((prev) => ({ ...prev, heroSubtitle: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="productsPerRow">Products Per Row</Label>
                  <Select
                    value={data.layout.productsPerRow.toString()}
                    onValueChange={(value) =>
                      setData((prev) => ({
                        ...prev,
                        layout: { ...prev.layout, productsPerRow: Number.parseInt(value) },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 columns</SelectItem>
                      <SelectItem value="4">4 columns</SelectItem>
                      <SelectItem value="5">5 columns</SelectItem>
                      <SelectItem value="6">6 columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rowsPerPage">Rows Per Page</Label>
                  <Input
                    id="rowsPerPage"
                    type="number"
                    min="1"
                    max="10"
                    value={data.rowsPerPage || 6}
                    onChange={(e) =>
                      setData((prev) => {
                        const rows = Number.parseInt(e.target.value) || 6
                        const productsPerPage = prev.layout.productsPerRow * rows
                        return {
                          ...prev,
                          rowsPerPage: rows,
                          productsPerPage,
                        }
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="cardSize">Card Size</Label>
                  <Select
                    value={data.layout.cardSize}
                    onValueChange={(value: "small" | "medium" | "large") =>
                      setData((prev) => ({
                        ...prev,
                        layout: { ...prev.layout, cardSize: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Products Per Page</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                    <span className="text-sm text-muted-foreground">
                      {data.layout.productsPerRow} × {data.rowsPerPage || 6} = {data.productsPerPage} products
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showPagination"
                  checked={data.showPagination}
                  onCheckedChange={(checked) => setData((prev) => ({ ...prev, showPagination: checked }))}
                />
                <Label htmlFor="showPagination">Show Pagination</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showFilters"
                    checked={data.layout.showFilters}
                    onCheckedChange={(checked) =>
                      setData((prev) => ({
                        ...prev,
                        layout: { ...prev.layout, showFilters: checked },
                      }))
                    }
                  />
                  <Label htmlFor="showFilters">Show Filters Bar</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableSearch"
                    checked={data.filters.enableSearch}
                    onCheckedChange={(checked) =>
                      setData((prev) => ({
                        ...prev,
                        filters: { ...prev.filters, enableSearch: checked },
                      }))
                    }
                  />
                  <Label htmlFor="enableSearch">Enable Search</Label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableCategoryFilter"
                    checked={data.filters.enableCategoryFilter}
                    onCheckedChange={(checked) =>
                      setData((prev) => ({
                        ...prev,
                        filters: { ...prev.filters, enableCategoryFilter: checked },
                      }))
                    }
                  />
                  <Label htmlFor="enableCategoryFilter">Enable Category Filter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableSubcategoryFilter"
                    checked={data.filters.enableSubcategoryFilter}
                    onCheckedChange={(checked) =>
                      setData((prev) => ({
                        ...prev,
                        filters: { ...prev.filters, enableSubcategoryFilter: checked },
                      }))
                    }
                  />
                  <Label htmlFor="enableSubcategoryFilter">Enable Subcategory Filter</Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableSorting"
                  checked={data.filters.enableSorting}
                  onCheckedChange={(checked) =>
                    setData((prev) => ({
                      ...prev,
                      filters: { ...prev.filters, enableSorting: checked },
                    }))
                  }
                />
                <Label htmlFor="enableSorting">Enable Sorting</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Content Blocks
                <div className="flex gap-2">
                  <Button onClick={() => addContentBlock("description")} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Description
                  </Button>
                  <Button onClick={() => addContentBlock("button")} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Button
                  </Button>
                  <Button onClick={() => addContentBlock("image")} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.contentBlocks.map((block) => (
                <Card key={block.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={block.visible}
                          onCheckedChange={(checked) => updateContentBlock(block.id, { visible: checked })}
                        />
                        <span className="font-medium">{block.title}</span>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteContentBlock(block.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Position</Label>
                        <Select
                          value={block.position}
                          onValueChange={(value: "before_products" | "after_products") =>
                            updateContentBlock(block.id, { position: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="before_products">Before Products</SelectItem>
                            <SelectItem value="after_products">After Products</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(block.type === "text" || block.title.includes("Description")) && (
                        <div className="grid gap-2">
                          <Label>Description</Label>
                          <Textarea
                            value={block.description || ""}
                            onChange={(e) => updateContentBlock(block.id, { description: e.target.value })}
                            rows={3}
                            placeholder="Enter block description..."
                          />
                        </div>
                      )}

                      {(block.type === "button" || block.title.includes("Button")) && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid gap-2">
                            <Label>Button Text</Label>
                            <Input
                              value={block.buttonText || ""}
                              onChange={(e) => updateContentBlock(block.id, { buttonText: e.target.value })}
                              placeholder="Enter button text..."
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Button Link</Label>
                            <Input
                              value={block.link || ""}
                              onChange={(e) => updateContentBlock(block.id, { link: e.target.value })}
                              placeholder="Enter button URL..."
                            />
                          </div>
                        </div>
                      )}

                      {(block.type === "image" || block.title.includes("Image")) && (
                        <div className="grid gap-2">
                          <Label>Image</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={block.image || ""}
                                onChange={(e) => updateContentBlock(block.id, { image: e.target.value })}
                                placeholder="Image URL"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const input = document.createElement("input")
                                  input.type = "file"
                                  input.accept = "image/*"
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0]
                                    if (file) handleImageUpload(file, block.id)
                                  }
                                  input.click()
                                }}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </div>
                            {block.image && (
                              <div className="relative w-32 h-24 border rounded overflow-hidden">
                                <img
                                  src={
                                    block.image.startsWith("http") ||
                                    block.image.startsWith("/") ||
                                    block.image.startsWith("data:")
                                      ? block.image
                                      : `/uploads/${block.image}`
                                  }
                                  alt="Block image preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.log("[v0] Image failed to load:", block.image)
                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {data.contentBlocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No content blocks yet. Click one of the buttons above to add a specific type of block.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
