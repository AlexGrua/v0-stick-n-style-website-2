"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Upload, Eye, EyeOff, MoveUp, MoveDown, Edit2, Check, X } from "lucide-react"
import { useHomePageData } from "@/hooks/use-home-page-data"
import { useAutoSave } from "@/hooks/use-auto-save"
import type { HomePageData, Category, CustomBlockData } from "@/lib/types"

export default function HomePageAdmin() {
  const { data, loading, saving, saveBlock, saveAll, setData } = useHomePageData()
  const [categories, setCategories] = useState<Category[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [editingBlockName, setEditingBlockName] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const safeData = data || {
    hero: {
      title: "Stick'N'Style",
      subtitle: "Премиальные отделочные материалы",
      description: "Создайте уникальный интерьер с нашими инновационными решениями для стен и полов",
      backgroundImage: "/modern-interior-3d-panels.png",
      ctaText: "Смотреть каталог",
      ctaLink: "/catalog",
      visible: true,
    },
    advantages: {
      title: "Наши преимущества",
      subtitle: "Почему выбирают нас",
      advantages: [],
      visible: true,
    },
    productGallery: {
      title: "Популярные товары",
      subtitle: "Наши бестселлеры",
      products: [],
      visible: true,
    },
    cooperation: {
      title: "Сотрудничество",
      subtitle: "Работаем с профессионалами",
      description: "Специальные условия для дизайнеров, архитекторов и строительных компаний",
      backgroundImage: "/fabric-texture-wall-panels.png",
      ctaText: "Стать партнером",
      ctaLink: "/partnership",
      visible: true,
    },
    customBlocks: [],
    blockOrder: ["hero", "advantages", "productGallery", "cooperation"],
    updatedAt: new Date().toISOString(),
  }

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const result = await response.json()
          setCategories(result.items || [])
        }
      } catch (error) {
        console.error("[v0] Failed to load categories:", error)
      }
    }
    loadCategories()
  }, [])

  useAutoSave(safeData?.hero, (heroData) => {
    if (heroData) saveBlock("hero", heroData)
  })

  useAutoSave(safeData?.advantages, (advantagesData) => {
    if (advantagesData) saveBlock("advantages", advantagesData)
  })

  useAutoSave(safeData?.productGallery, (galleryData) => {
    if (galleryData) saveBlock("productGallery", galleryData)
  })

  useAutoSave(safeData?.cooperation, (cooperationData) => {
    if (cooperationData) saveBlock("cooperation", cooperationData)
  })

  useAutoSave(safeData?.customBlocks, (customBlocks) => {
    if (customBlocks) saveBlock("customBlocks", customBlocks)
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Загрузка...</div>
  }

  const createNewBlock = () => {
    const newBlock: CustomBlockData = {
      id: crypto.randomUUID(),
      type: "custom",
      title: "Новый блок",
      subtitle: "Подзаголовок блока",
      description: "Описание нового блока. Расскажите о ваших услугах или преимуществах.",
      backgroundImage: "/fabric-texture-wall-panels.png",
      ctaText: "Узнать больше",
      ctaLink: "/contact",
      visible: true,
      order: safeData.customBlocks.length + 5, // Start after main blocks (1-4)
    }

    const updatedData = {
      ...safeData,
      customBlocks: [...safeData.customBlocks, newBlock],
    }
    setData(updatedData)
  }

  const removeCustomBlock = (id: string) => {
    const updatedData = {
      ...safeData,
      customBlocks: safeData.customBlocks.filter((block) => block.id !== id),
    }
    setData(updatedData)
  }

  const updateCustomBlock = (id: string, field: string, value: any) => {
    const updatedData = {
      ...safeData,
      customBlocks: safeData.customBlocks.map((block) => (block.id === id ? { ...block, [field]: value } : block)),
    }
    setData(updatedData)
  }

  const startEditingBlockName = (blockId: string, currentName: string) => {
    setEditingBlockId(blockId)
    setEditingBlockName(currentName)
  }

  const saveBlockName = (blockId: string) => {
    if (editingBlockName.trim()) {
      updateCustomBlock(blockId, "title", editingBlockName.trim())
      // Принудительно обновляем состояние для перерендера табов
      const updatedBlocks = safeData.customBlocks.map((block) =>
        block.id === blockId ? { ...block, title: editingBlockName.trim() } : block,
      )
      const updatedData = {
        ...safeData,
        customBlocks: updatedBlocks,
      }
      setData(updatedData)
    }
    setEditingBlockId(null)
    setEditingBlockName("")
  }

  const cancelEditingBlockName = () => {
    setEditingBlockId(null)
    setEditingBlockName("")
  }

  const moveCustomBlock = (id: string, direction: "up" | "down") => {
    const blocks = [...safeData.customBlocks]
    const index = blocks.findIndex((block) => block.id === id)

    if (index === -1) return

    if (direction === "up" && index > 0) {
      ;[blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]]
    } else if (direction === "down" && index < blocks.length - 1) {
      ;[blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]]
    }

    // Update order values
    blocks.forEach((block, idx) => {
      block.order = idx + 5 // Start after main blocks
    })

    const updatedData = {
      ...safeData,
      customBlocks: blocks,
    }
    setData(updatedData)
  }

  const moveMainBlock = (blockType: string, direction: "up" | "down") => {
    console.log("[v0] Moving main block:", blockType, direction)

    const mainBlocks = ["hero", "advantages", "productGallery", "cooperation"]
    const currentOrder = safeData.blockOrder || mainBlocks
    const index = currentOrder.indexOf(blockType === "gallery" ? "productGallery" : blockType)

    if (index === -1) return

    const newOrder = [...currentOrder]

    if (direction === "up" && index > 0) {
      ;[newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
    } else if (direction === "down" && index < newOrder.length - 1) {
      ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    }

    const updatedData = {
      ...safeData,
      blockOrder: newOrder,
    }
    setData(updatedData)
  }

  const handleImageUpload = async (blockType: string, field: string, blockId?: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Create a blob URL for immediate preview
        const imageUrl = URL.createObjectURL(file)

        // Update the data immediately
        const updatedData = { ...safeData }
        if (blockType === "hero") {
          updatedData.hero = { ...updatedData.hero, [field]: imageUrl }
        } else if (blockType === "cooperation") {
          updatedData.cooperation = { ...updatedData.cooperation, [field]: imageUrl }
        } else if (blockType === "custom" && blockId) {
          updatedData.customBlocks = updatedData.customBlocks.map((block) =>
            block.id === blockId ? { ...block, [field]: imageUrl } : block,
          )
        } else if (blockType === "product" && blockId) {
          updatedData.productGallery = {
            ...updatedData.productGallery,
            products: updatedData.productGallery.products.map((product) =>
              product.id === blockId ? { ...product, image: imageUrl } : product,
            ),
          }
        }
        setData(updatedData)

        console.log("[v0] Image uploaded for", blockType, field)
      }
    }
    input.click()
  }

  const addAdvantage = () => {
    const newAdvantage = {
      id: crypto.randomUUID(),
      icon: "⭐",
      title: "Новое преимущество",
      description: "Описание преимущества",
    }
    const updatedData = {
      ...safeData,
      advantages: {
        ...safeData.advantages,
        advantages: [...safeData.advantages.advantages, newAdvantage],
      },
    }
    setData(updatedData)
  }

  const removeAdvantage = (id: string) => {
    const updatedData = {
      ...safeData,
      advantages: {
        ...safeData.advantages,
        advantages: safeData.advantages.advantages.filter((item) => item.id !== id),
      },
    }
    setData(updatedData)
  }

  const addProduct = () => {
    const newProduct = {
      id: crypto.randomUUID(),
      name: "Новый товар",
      image: "/diverse-products-still-life.png",
      category: categories[0]?.slug || "wall-panel",
      link: `/catalog/${categories[0]?.slug || "wall-panel"}`,
    }
    const updatedData = {
      ...safeData,
      productGallery: {
        ...safeData.productGallery,
        products: [...safeData.productGallery.products, newProduct],
      },
    }
    setData(updatedData)
  }

  const removeProduct = (id: string) => {
    const updatedData = {
      ...safeData,
      productGallery: {
        ...safeData.productGallery,
        products: safeData.productGallery.products.filter((item) => item.id !== id),
      },
    }
    setData(updatedData)
  }

  const updateField = (blockType: keyof HomePageData, field: string, value: any) => {
    const updatedData = {
      ...safeData,
      [blockType]: {
        ...safeData[blockType],
        [field]: value,
      },
    }
    setData(updatedData)
  }

  const updateAdvantage = (id: string, field: string, value: string) => {
    const updatedData = {
      ...safeData,
      advantages: {
        ...safeData.advantages,
        advantages: safeData.advantages.advantages.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      },
    }
    setData(updatedData)
  }

  const updateProduct = (id: string, field: string, value: string) => {
    const updatedData = {
      ...safeData,
      productGallery: {
        ...safeData.productGallery,
        products: safeData.productGallery.products.map((item) => {
          if (item.id === id) {
            const updated = { ...item, [field]: value }
            // Auto-update link when category changes
            if (field === "category") {
              updated.link = `/catalog/${value}`
            }
            return updated
          }
          return item
        }),
      },
    }
    setData(updatedData)
  }

  const handlePreview = () => {
    window.open("/", "_blank")
  }

  const handleSave = async () => {
    try {
      setSaveStatus("saving")
      console.log("[v0] Saving all data:", safeData)
      await saveAll(safeData)
      console.log("[v0] All data saved successfully")
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      console.error("[v0] Failed to save data:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление главной страницей</h1>
          <p className="text-muted-foreground">Настройте содержимое и порядок блоков на главной странице</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={saveStatus === "saving"} className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {saveStatus === "saved" && <Check className="h-4 w-4" />}
            {saveStatus === "error" && <X className="h-4 w-4" />}
            {saveStatus === "saving"
              ? "Сохранение..."
              : saveStatus === "saved"
                ? "Сохранено!"
                : saveStatus === "error"
                  ? "Ошибка!"
                  : "Сохранить изменения"}
          </Button>
          <Button variant="outline" onClick={() => window.open("/", "_blank")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div>
          <h3 className="font-semibold text-orange-900">Дополнительные блоки</h3>
          <p className="text-sm text-orange-700">Создавайте дополнительные блоки для расширения функционала страницы</p>
        </div>
        <Button onClick={createNewBlock} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Создать новый блок
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList className={`grid w-full ${safeData.customBlocks.length > 0 ? "grid-cols-6" : "grid-cols-4"}`}>
          <TabsTrigger value="hero" className="flex items-center gap-2">
            {safeData.hero.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Hero блок
          </TabsTrigger>
          <TabsTrigger value="advantages" className="flex items-center gap-2">
            {safeData.advantages.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Преимущества
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            {safeData.productGallery.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Галерея
          </TabsTrigger>
          <TabsTrigger value="cooperation" className="flex items-center gap-2">
            {safeData.cooperation.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Сотрудничество
          </TabsTrigger>
          {safeData.customBlocks.length > 0 && (
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {safeData.customBlocks.length === 1
                ? safeData.customBlocks[0].title
                : `Доп. блоки (${safeData.customBlocks.length})`}
            </TabsTrigger>
          )}
          <TabsTrigger value="order" className="flex items-center gap-2">
            <MoveUp className="h-4 w-4" />
            Порядок блоков
          </TabsTrigger>
        </TabsList>

        {/* Hero Block */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hero блок</CardTitle>
                  <CardDescription>Главный баннер страницы</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={safeData.hero.visible ? "default" : "secondary"}>
                    {safeData.hero.visible ? "Видимый" : "Скрытый"}
                  </Badge>
                  <Switch
                    checked={safeData.hero.visible}
                    onCheckedChange={(checked) => updateField("hero", "visible", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero-title">Заголовок</Label>
                  <Input
                    id="hero-title"
                    value={safeData.hero.title}
                    onChange={(e) => updateField("hero", "title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-subtitle">Подзаголовок</Label>
                  <Input
                    id="hero-subtitle"
                    value={safeData.hero.subtitle}
                    onChange={(e) => updateField("hero", "subtitle", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-description">Описание</Label>
                <Textarea
                  id="hero-description"
                  value={safeData.hero.description}
                  onChange={(e) => updateField("hero", "description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero-button">Текст кнопки</Label>
                  <Input
                    id="hero-button"
                    value={safeData.hero.ctaText}
                    onChange={(e) => updateField("hero", "ctaText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-link">Ссылка кнопки</Label>
                  <Input
                    id="hero-link"
                    value={safeData.hero.ctaLink}
                    onChange={(e) => updateField("hero", "ctaLink", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Фоновое изображение</Label>
                <div className="flex items-center gap-4">
                  {safeData.hero.backgroundImage && (
                    <img
                      src={safeData.hero.backgroundImage || "/placeholder.svg"}
                      alt="Background preview"
                      className="w-20 h-20 object-cover rounded border"
                    />
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleImageUpload("hero", "backgroundImage")}
                    className="bg-transparent"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить изображение
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advantages Block */}
        <TabsContent value="advantages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Блок преимуществ</CardTitle>
                  <CardDescription>Список ключевых преимуществ компании</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={safeData.advantages.visible ? "default" : "secondary"}>
                    {safeData.advantages.visible ? "Видимый" : "Скрытый"}
                  </Badge>
                  <Switch
                    checked={safeData.advantages.visible}
                    onCheckedChange={(checked) => updateField("advantages", "visible", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-title">Заголовок</Label>
                  <Input
                    id="adv-title"
                    value={safeData.advantages.title}
                    onChange={(e) => updateField("advantages", "title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adv-subtitle">Подзаголовок</Label>
                  <Input
                    id="adv-subtitle"
                    value={safeData.advantages.subtitle}
                    onChange={(e) => updateField("advantages", "subtitle", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Преимущества</Label>
                  <Button size="sm" variant="outline" onClick={addAdvantage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить преимущество
                  </Button>
                </div>

                {safeData.advantages.advantages.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Иконка (emoji)"
                            value={item.icon}
                            onChange={(e) => updateAdvantage(item.id, "icon", e.target.value)}
                            className="w-20"
                          />
                          <Input
                            placeholder="Название преимущества"
                            value={item.title}
                            onChange={(e) => updateAdvantage(item.id, "title", e.target.value)}
                          />
                        </div>
                        <Textarea
                          placeholder="Описание преимущества"
                          value={item.description}
                          onChange={(e) => updateAdvantage(item.id, "description", e.target.value)}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeAdvantage(item.id)}
                        className="text-red-500 bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Gallery Block */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Галерея продуктов</CardTitle>
                  <CardDescription>Витрина популярных товаров</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={safeData.productGallery.visible ? "default" : "secondary"}>
                    {safeData.productGallery.visible ? "Видимый" : "Скрытый"}
                  </Badge>
                  <Switch
                    checked={safeData.productGallery.visible}
                    onCheckedChange={(checked) => updateField("productGallery", "visible", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gallery-title">Заголовок</Label>
                  <Input
                    id="gallery-title"
                    value={safeData.productGallery.title}
                    onChange={(e) => updateField("productGallery", "title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gallery-subtitle">Подзаголовок</Label>
                  <Input
                    id="gallery-subtitle"
                    value={safeData.productGallery.subtitle}
                    onChange={(e) => updateField("productGallery", "subtitle", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Товары в галерее</Label>
                  <Button size="sm" variant="outline" onClick={addProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить товар
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {safeData.productGallery.products.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Название товара"
                              value={item.name}
                              onChange={(e) => updateProduct(item.id, "name", e.target.value)}
                            />
                            <Select
                              value={item.category}
                              onValueChange={(value) => updateProduct(item.id, "category", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите категорию" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.slug}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.image && (
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt="Product preview"
                                className="w-16 h-16 object-cover rounded border"
                              />
                            )}
                            <Button
                              variant="outline"
                              onClick={() => handleImageUpload("product", "image", item.id)}
                              className="bg-transparent"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Загрузить изображение
                            </Button>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeProduct(item.id)}
                          className="text-red-500 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cooperation Block */}
        <TabsContent value="cooperation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Блок сотрудничества</CardTitle>
                  <CardDescription>Призыв к партнерству</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={safeData.cooperation.visible ? "default" : "secondary"}>
                    {safeData.cooperation.visible ? "Видимый" : "Скрытый"}
                  </Badge>
                  <Switch
                    checked={safeData.cooperation.visible}
                    onCheckedChange={(checked) => updateField("cooperation", "visible", checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coop-title">Заголовок</Label>
                  <Input
                    id="coop-title"
                    value={safeData.cooperation.title}
                    onChange={(e) => updateField("cooperation", "title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coop-subtitle">Подзаголовок</Label>
                  <Input
                    id="coop-subtitle"
                    value={safeData.cooperation.subtitle}
                    onChange={(e) => updateField("cooperation", "subtitle", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coop-description">Описание</Label>
                <Textarea
                  id="coop-description"
                  value={safeData.cooperation.description}
                  onChange={(e) => updateField("cooperation", "description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coop-button">Текст кнопки</Label>
                  <Input
                    id="coop-button"
                    value={safeData.cooperation.ctaText}
                    onChange={(e) => updateField("cooperation", "ctaText", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coop-link">Ссылка кнопки</Label>
                  <Input
                    id="coop-link"
                    value={safeData.cooperation.ctaLink}
                    onChange={(e) => updateField("cooperation", "ctaLink", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Фоновое изображение</Label>
                <div className="flex items-center gap-4">
                  {safeData.cooperation.backgroundImage && (
                    <img
                      src={safeData.cooperation.backgroundImage || "/placeholder.svg"}
                      alt="Background preview"
                      className="w-20 h-20 object-cover rounded border"
                    />
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleImageUpload("cooperation", "backgroundImage")}
                    className="bg-transparent"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить изображение
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {safeData.customBlocks.length > 0 && (
          <TabsContent value="custom">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Дополнительные блоки</h3>
                  <p className="text-sm text-muted-foreground">Управляйте дополнительными блоками страницы</p>
                </div>
                <Button onClick={createNewBlock} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить блок
                </Button>
              </div>

              {safeData.customBlocks
                .sort((a, b) => a.order - b.order)
                .map((block, index) => (
                  <Card key={block.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {editingBlockId === block.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingBlockName}
                                onChange={(e) => setEditingBlockName(e.target.value)}
                                className="w-48"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveBlockName(block.id)
                                  if (e.key === "Escape") cancelEditingBlockName()
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="outline" onClick={() => saveBlockName(block.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditingBlockName}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CardTitle>
                                Блок {index + 1}: {block.title}
                              </CardTitle>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingBlockName(block.id, block.title)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <Badge variant={block.visible ? "default" : "secondary"}>
                            {block.visible ? "Видимый" : "Скрытый"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveCustomBlock(block.id, "up")}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveCustomBlock(block.id, "down")}
                            disabled={index === safeData.customBlocks.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={block.visible}
                            onCheckedChange={(checked) => updateCustomBlock(block.id, "visible", checked)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeCustomBlock(block.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>Дополнительный блок контента</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Заголовок</Label>
                          <Input
                            value={block.title}
                            onChange={(e) => updateCustomBlock(block.id, "title", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Подзаголовок</Label>
                          <Input
                            value={block.subtitle}
                            onChange={(e) => updateCustomBlock(block.id, "subtitle", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Описание</Label>
                        <Textarea
                          value={block.description}
                          onChange={(e) => updateCustomBlock(block.id, "description", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Текст кнопки</Label>
                          <Input
                            value={block.ctaText}
                            onChange={(e) => updateCustomBlock(block.id, "ctaText", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ссылка кнопки</Label>
                          <Input
                            value={block.ctaLink}
                            onChange={(e) => updateCustomBlock(block.id, "ctaLink", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Фоновое изображение</Label>
                        <div className="flex items-center gap-4">
                          {block.backgroundImage && (
                            <img
                              src={block.backgroundImage || "/placeholder.svg"}
                              alt="Background preview"
                              className="w-20 h-20 object-cover rounded border"
                            />
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleImageUpload("custom", "backgroundImage", block.id)}
                            className="bg-transparent"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Загрузить изображение
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle>Порядок блоков на странице</CardTitle>
              <CardDescription>Управляйте порядком отображения всех блоков на главной странице</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Основные блоки</h4>
                <div className="space-y-2">
                  {(safeData.blockOrder || ["hero", "advantages", "productGallery", "cooperation"]).map(
                    (blockKey, index) => {
                      const blockInfo = {
                        hero: { name: "Hero блок", visible: safeData.hero.visible },
                        advantages: { name: "Преимущества", visible: safeData.advantages.visible },
                        productGallery: { name: "Галерея продуктов", visible: safeData.productGallery.visible },
                        cooperation: { name: "Сотрудничество", visible: safeData.cooperation.visible },
                      }[blockKey]

                      if (!blockInfo) return null

                      return (
                        <div key={blockKey} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span>{blockInfo.name}</span>
                            <Badge variant={blockInfo.visible ? "default" : "secondary"}>
                              {blockInfo.visible ? "Видимый" : "Скрытый"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveMainBlock(blockKey, "up")}
                              disabled={index === 0}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveMainBlock(blockKey, "down")}
                              disabled={
                                index ===
                                (safeData.blockOrder || ["hero", "advantages", "productGallery", "cooperation"])
                                  .length -
                                  1
                              }
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    },
                  )}
                </div>
              </div>

              {safeData.customBlocks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Дополнительные блоки</h4>
                  <div className="space-y-2">
                    {safeData.customBlocks
                      .sort((a, b) => a.order - b.order)
                      .map((block, index) => (
                        <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">#{index + 5}</span>
                            <span>{block.title}</span>
                            <Badge variant={block.visible ? "default" : "secondary"}>
                              {block.visible ? "Видимый" : "Скрытый"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveCustomBlock(block.id, "up")}
                              disabled={index === 0}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveCustomBlock(block.id, "down")}
                              disabled={index === safeData.customBlocks.length - 1}
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
