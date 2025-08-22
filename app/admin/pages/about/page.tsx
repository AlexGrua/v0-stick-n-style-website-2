"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect, useCallback } from "react"
import { MoveUp, MoveDown, Plus, Trash2, X } from "lucide-react"

type AboutPageData = {
  hero: {
    visible: boolean
    title: string
    description: string
    images: string[]
    mainImage: string
  }
  approach: {
    visible: boolean
    title: string
    description: string
    features: Array<{
      title: string
      description: string
      icon?: string
    }>
  }
  orderProcess: {
    visible: boolean
    title: string
    description: string
    buttonText: string
    buttonLink: string
    steps: Array<{
      number: string
      title: string
      description: string
    }>
  }
  blockOrder: string[]
}

const defaultData: AboutPageData = {
  hero: {
    visible: true,
    title: "About Stick'N'Style",
    description: "We are a B2B supplier of 3D wall panels, flooring, and adhesive solutions.",
    images: [],
    mainImage: "",
  },
  approach: {
    visible: true,
    title: "Our approach",
    description: "Ergonomics first. We streamline tables, inputs, and exports to fit wholesale workflows.",
    features: [{ title: "Streamlined Workflow", description: "Totals for boxes, pcs, kg, and m³ are always visible" }],
  },
  orderProcess: {
    visible: true,
    title: "Create an Order in 1 Click",
    description: "Add multiple items fast, track boxes/kg/m³, and export to PDF / Excel.",
    buttonText: "Create Now",
    buttonLink: "/create-order",
    steps: [{ number: "1", title: "Pick products", description: "Browse catalog, select categories, and set sizes." }],
  },
  blockOrder: ["hero", "approach", "orderProcess"],
}

export default function AboutPageAdmin() {
  const { toast } = useToast()
  const [data, setData] = useState<AboutPageData>(defaultData)
  const [loading, setLoading] = useState(false)

  const addHeroImage = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const currentImages = data.hero.images || []
          setData((prev) => ({
            ...prev,
            hero: { ...prev.hero, images: [...currentImages, dataUrl] },
          }))
          toast({ title: "Success", description: "Image added successfully" })
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const removeHeroImage = (index: number) => {
    const currentImages = data.hero.images || []
    const updatedImages = currentImages.filter((_, i) => i !== index)
    setData((prev) => ({
      ...prev,
      hero: { ...prev.hero, images: updatedImages },
    }))
  }

  const moveBlock = (blockKey: string, direction: "up" | "down") => {
    const currentIndex = data.blockOrder.indexOf(blockKey)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= data.blockOrder.length) return

    const updatedBlockOrder = [...data.blockOrder]
    updatedBlockOrder[currentIndex] = data.blockOrder[newIndex]
    updatedBlockOrder[newIndex] = blockKey

    setData((prev) => ({ ...prev, blockOrder: updatedBlockOrder }))
  }

  const addFeature = () => {
    setData((prev) => ({
      ...prev,
      approach: {
        ...prev.approach,
        features: [...prev.approach.features, { title: "New Feature", description: "Feature description" }],
      },
    }))
  }

  const addStep = () => {
    setData((prev) => ({
      ...prev,
      orderProcess: {
        ...prev.orderProcess,
        steps: [
          ...prev.orderProcess.steps,
          {
            number: (prev.orderProcess.steps.length + 1).toString(),
            title: "New Step",
            description: "Step description",
          },
        ],
      },
    }))
  }

  useEffect(() => {
    loadData()
  }, [])

  const debouncedSave = useCallback(
    debounce(() => {
      saveData()
    }, 1000),
    [],
  )

  useEffect(() => {
    if (data !== defaultData) {
      debouncedSave()
    }
  }, [data, debouncedSave])

  async function loadData() {
    try {
      const res = await fetch("/api/pages/about")
      if (res.ok) {
        const pageData = await res.json()
        if (pageData.content) {
          const parsed = JSON.parse(pageData.content)
          setData({ ...defaultData, ...parsed })
        }
      }
    } catch (error) {
      console.error("Failed to load about page data:", error)
    }
  }

  async function saveData() {
    setLoading(true)
    try {
      const res = await fetch("/api/pages/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.hero.title,
          path: "/about",
          content: JSON.stringify(data),
          seoTitle: `${data.hero.title} - Stick'N'Style`,
          seoDescription: data.hero.description,
          visible: true,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast({ title: "Saved", description: "About page updated successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">About Us Page</h1>
        <Button onClick={saveData} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hero">Hero Block</TabsTrigger>
          <TabsTrigger value="approach">Our Approach</TabsTrigger>
          <TabsTrigger value="order">Order Process</TabsTrigger>
          <TabsTrigger value="blockOrder">Block Order</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hero Block</CardTitle>
                  <CardDescription>Main introduction section with image slider</CardDescription>
                </div>
                <Switch
                  checked={data.hero.visible}
                  onCheckedChange={(checked) =>
                    setData((prev) => ({ ...prev, hero: { ...prev.hero, visible: checked } }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={data.hero.title}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={data.hero.description}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, description: e.target.value },
                      }))
                    }
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Изображения для слайдера</Label>
                  <Button size="sm" variant="outline" onClick={addHeroImage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить изображение
                  </Button>
                </div>

                {(data.hero.images || []).length > 0 && (
                  <div className="grid grid-cols-6 gap-2">
                    {(data.hero.images || []).map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Hero image ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeHeroImage(index)}
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-red-500 bg-white border"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approach">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Our Approach</CardTitle>
                  <CardDescription>Company approach and features</CardDescription>
                </div>
                <Switch
                  checked={data.approach.visible}
                  onCheckedChange={(checked) =>
                    setData((prev) => ({ ...prev, approach: { ...prev.approach, visible: checked } }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={data.approach.title}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        approach: { ...prev.approach, title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={data.approach.description}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        approach: { ...prev.approach, description: e.target.value },
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Features</Label>
                    <Button size="sm" onClick={addFeature}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                  {data.approach.features.map((feature, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Feature {index + 1}</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setData((prev) => ({
                                ...prev,
                                approach: {
                                  ...prev.approach,
                                  features: prev.approach.features.filter((_, i) => i !== index),
                                },
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          <Input
                            placeholder="Feature title"
                            value={feature.title}
                            onChange={(e) => {
                              const updatedFeatures = [...data.approach.features]
                              updatedFeatures[index] = { ...feature, title: e.target.value }
                              setData((prev) => ({
                                ...prev,
                                approach: { ...prev.approach, features: updatedFeatures },
                              }))
                            }}
                          />
                          <Textarea
                            placeholder="Feature description"
                            value={feature.description}
                            onChange={(e) => {
                              const updatedFeatures = [...data.approach.features]
                              updatedFeatures[index] = { ...feature, description: e.target.value }
                              setData((prev) => ({
                                ...prev,
                                approach: { ...prev.approach, features: updatedFeatures },
                              }))
                            }}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="order">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order Process</CardTitle>
                  <CardDescription>Create order section with steps</CardDescription>
                </div>
                <Switch
                  checked={data.orderProcess.visible}
                  onCheckedChange={(checked) =>
                    setData((prev) => ({ ...prev, orderProcess: { ...prev.orderProcess, visible: checked } }))
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={data.orderProcess.title}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        orderProcess: { ...prev.orderProcess, title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Button Text</Label>
                  <Input
                    value={data.orderProcess.buttonText}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        orderProcess: { ...prev.orderProcess, buttonText: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={data.orderProcess.description}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      orderProcess: { ...prev.orderProcess, description: e.target.value },
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>Button Link</Label>
                <Input
                  value={data.orderProcess.buttonLink}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      orderProcess: { ...prev.orderProcess, buttonLink: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Steps</Label>
                  <Button size="sm" onClick={addStep}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
                {data.orderProcess.steps.map((step, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Step {step.number}</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              orderProcess: {
                                ...prev.orderProcess,
                                steps: prev.orderProcess.steps.filter((_, i) => i !== index),
                              },
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Input
                          placeholder="Number"
                          value={step.number}
                          onChange={(e) => {
                            const updatedSteps = [...data.orderProcess.steps]
                            updatedSteps[index] = { ...step, number: e.target.value }
                            setData((prev) => ({
                              ...prev,
                              orderProcess: { ...prev.orderProcess, steps: updatedSteps },
                            }))
                          }}
                        />
                        <Input
                          placeholder="Step title"
                          value={step.title}
                          onChange={(e) => {
                            const updatedSteps = [...data.orderProcess.steps]
                            updatedSteps[index] = { ...step, title: e.target.value }
                            setData((prev) => ({
                              ...prev,
                              orderProcess: { ...prev.orderProcess, steps: updatedSteps },
                            }))
                          }}
                        />
                        <Textarea
                          placeholder="Step description"
                          value={step.description}
                          onChange={(e) => {
                            const updatedSteps = [...data.orderProcess.steps]
                            updatedSteps[index] = { ...step, description: e.target.value }
                            setData((prev) => ({
                              ...prev,
                              orderProcess: { ...prev.orderProcess, steps: updatedSteps },
                            }))
                          }}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blockOrder">
          <Card>
            <CardHeader>
              <CardTitle>Block Order</CardTitle>
              <CardDescription>Manage the order of blocks on the About Us page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.blockOrder.map((blockKey, index) => {
                const blockInfo = {
                  hero: { name: "Hero Block", visible: data.hero.visible },
                  approach: { name: "Our Approach", visible: data.approach.visible },
                  orderProcess: { name: "Order Process", visible: data.orderProcess.visible },
                }[blockKey]

                if (!blockInfo) return null

                return (
                  <div key={blockKey} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span>{blockInfo.name}</span>
                      <Badge variant={blockInfo.visible ? "default" : "secondary"}>
                        {blockInfo.visible ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveBlock(blockKey, "up")}
                        disabled={index === 0}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveBlock(blockKey, "down")}
                        disabled={index === data.blockOrder.length - 1}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
