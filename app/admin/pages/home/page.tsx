"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Upload, Eye, EyeOff, MoveUp, MoveDown, X, Save, Loader2, Check, Edit2 } from "lucide-react"
import { useHomePageData } from "@/hooks/use-home-page-data"
import { useAutoSave } from "@/hooks/use-auto-save"
import { useToast } from "@/hooks/use-toast"
import type { HomePageData, Category } from "@/lib/types"

export default function HomePageAdmin() {
  const { data, loading, saving, saveBlock, saveAll, setData } = useHomePageData()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [editingBlockName, setEditingBlockName] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [safeCooperationFeatures, setSafeCooperationFeatures] = useState<any[]>([])
  const [safeCooperationButtons, setSafeCooperationButtons] = useState<any[]>([])
  const [isCreatingBlock, setIsCreatingBlock] = useState(false)
  const [debouncedSave, setDebouncedSave] = useState<NodeJS.Timeout | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const defaultData: HomePageData = {
    hero: {
      title: "Stick'N'Style",
      subtitle: "Премиальные отделочные материалы",
      description: "Создайте уникальный интерьер с нашими инновационными решениями для стен и полов",
      backgroundImage: "/modern-interior-3d-panels.png",
      images: [],
      buttons: [
        {
          id: "1",
          text: "Смотреть каталог",
          link: "/catalog",
          variant: "primary",
        },
      ],
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
      uploadedImage: "",
      ctaText: "Стать партнером",
      ctaLink: "/partnership",
      visible: true,
      features: [],
      buttons: [],
      offers: [],
      stats: [],
    },
    customBlocks: [],
    blockOrder: ["hero", "advantages", "productGallery", "cooperation"],
    updatedAt: new Date().toISOString(),
  }

  const safeData = data || defaultData
  const safeAdvantages = Array.isArray(safeData.advantages?.advantages) ? safeData.advantages.advantages : []
  const safeProducts = Array.isArray(safeData.productGallery?.products) ? safeData.productGallery.products : []
  const safeCustomBlocks = Array.isArray(safeData.customBlocks) ? safeData.customBlocks : []
  const safeBlockOrder = Array.isArray(safeData.blockOrder)
    ? safeData.blockOrder
    : ["hero", "advantages", "productGallery", "cooperation"]

  const debouncedUpdateField = useCallback(
    (blockType: string, field: string, value: any) => {
      if (debouncedSave) {
        clearTimeout(debouncedSave)
      }

      const timer = setTimeout(() => {
        updateField(blockType, field, value)
      }, 500)

      setDebouncedSave(timer)
    },
    [debouncedSave],
  )

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append("file", file)
    const response = await fetch("/api/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    })
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      console.error("[v0] Upload failed:", text)
      throw new Error("Upload failed")
    }
    const { url } = await response.json()
    return url as string
  }, [])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories", { credentials: "include" })
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

  useEffect(() => {
    const currentFeatures = safeData.cooperation?.features || []
    const currentButtons = safeData.cooperation?.buttons || []

    if (JSON.stringify(currentFeatures) !== JSON.stringify(safeCooperationFeatures)) {
      setSafeCooperationFeatures(currentFeatures)
    }

    if (JSON.stringify(currentButtons) !== JSON.stringify(safeCooperationButtons)) {
      setSafeCooperationButtons(currentButtons)
    }
  }, [safeData.cooperation?.features, safeData.cooperation?.buttons, safeCooperationFeatures, safeCooperationButtons])

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

  const updateField = (blockType: string, field: string, value: any) => {
    const updatedData = {
      ...safeData,
      [blockType]: {
        ...(safeData as any)[blockType],
        [field]: value,
      },
    }
    setData(updatedData)
  }

  const addHeroImage = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const uploadedUrl = await uploadImage(file)
          const currentImages = safeData.hero.images || []
          const updatedImages = [...currentImages, uploadedUrl]
          
          // Обновляем состояние
          updateField("hero", "images", updatedImages)
          
          // Сразу сохраняем изменения
          const updatedData = {
            ...safeData,
            hero: {
              ...safeData.hero,
              images: updatedImages,
            },
          }
          await saveAll(updatedData)
          
          console.log("[v0] Image added to hero slider and saved, updated images:", updatedImages)
          toast({
            title: "Изображение загружено",
            description: "Изображение успешно добавлено в слайдер.",
          })
        } catch (error) {
          console.error("[v0] Error uploading hero image:", error)
          toast({
            title: "Ошибка загрузки",
            description: "Не удалось загрузить изображение. Попробуйте еще раз.",
            variant: "destructive",
          })
        }
      }
    }
    input.click()
  }

  const removeHeroImage = async (index: number) => {
    const currentImages = safeData.hero.images || []
    const updatedImages = currentImages.filter((_, i) => i !== index)
    
    // Обновляем состояние
    updateField("hero", "images", updatedImages)
    
    // Сразу сохраняем изменения
    const updatedData = {
      ...safeData,
      hero: {
        ...safeData.hero,
        images: updatedImages,
      },
    }
    await saveAll(updatedData)
    
    console.log("[v0] Image removed from hero slider and saved, updated images:", updatedImages)
    toast({
      title: "Изображение удалено",
      description: "Изображение успешно удалено из слайдера.",
    })
  }

  const uploadCooperationImage = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const uploadedUrl = await uploadImage(file)
          updateField("cooperation", "uploadedImage", uploadedUrl)
          console.log("[v0] Image uploaded for cooperation block")
        } catch (error) {
          console.error("[v0] Error uploading cooperation image:", error)
        }
      }
    }
    input.click()
  }

  const addCustomBlock = async () => {
    setIsCreatingBlock(true)

    const newBlock = {
      id: `custom-${Date.now()}`,
      type: "custom" as const,
      title: `Новый блок ${safeCustomBlocks.length + 1}`,
      subtitle: "Описание нового блока",
      description: "Подробное описание функционала блока",
      backgroundImage: "/fabric-texture-wall-panels.png",
      images: [],
      buttons: [],
      features: [],
      visible: true,
      order: safeCustomBlocks.length + 5,
    }

    const updatedData = {
      ...safeData,
      customBlocks: [...safeCustomBlocks, newBlock],
    }

    // Сначала обновляем локальное состояние
    setData(updatedData)

    // Сохраняем блок сразу после создания
    try {
      console.log("[v0] addCustomBlock - saving new block:", newBlock.id)
      await saveAll(updatedData)
      console.log("[v0] addCustomBlock - block saved successfully")
      
      toast({
        title: "Блок создан",
        description: "Новый блок был успешно создан и сохранен.",
      })
      
      // Переключаемся на вкладку с блоками после создания
      setTimeout(() => {
        startEditingBlockName(newBlock.id, newBlock.title)
        setIsCreatingBlock(false)
      }, 100)
    } catch (error) {
      console.error("[v0] Error saving new block:", error)
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить новый блок. Попробуйте еще раз.",
        variant: "destructive",
      })
      setIsCreatingBlock(false)
    }
  }

  const startEditingBlockName = (blockId: string, currentName: string) => {
    setEditingBlockId(blockId)
    setEditingBlockName(currentName)
  }

  const saveBlockName = (blockId: string) => {
    if (editingBlockName.trim()) {
      updateCustomBlock(blockId, "title", editingBlockName.trim())
      console.log("[v0] Block name updated:", editingBlockName.trim())
    }
    setEditingBlockId(null)
    setEditingBlockName("")
  }

  const updateCustomBlock = (id: string, field: string, value: any) => {
    const updatedData = {
      ...safeData,
      customBlocks: safeCustomBlocks.map((block: any) => (block.id === id ? { ...block, [field]: value } : block)),
    }
    setData(updatedData)
  }

  const addCustomBlockImage = async (blockId: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const uploadedUrl = await uploadImage(file)
          const updatedBlocks = safeCustomBlocks.map((block) => {
            if (block.id === blockId) {
              const currentImages = block.images || []
              return { ...block, images: [...currentImages, uploadedUrl] }
            }
            return block
          })
          updateField("customBlocks", "", updatedBlocks)
          console.log("[v0] Image added to custom block")
        } catch (error) {
          console.error("[v0] Error uploading custom block image:", error)
        }
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
        advantages: [...safeAdvantages, newAdvantage],
      },
    }
    setData(updatedData)
  }

  const removeAdvantage = (id: string) => {
    const updatedData = {
      ...safeData,
      advantages: {
        ...safeData.advantages,
        advantages: safeAdvantages.filter((item) => item.id !== id),
      },
    }
    setData(updatedData)
  }

  const updateAdvantage = (id: string, field: string, value: string) => {
    const updatedData = {
      ...safeData,
      advantages: {
        ...safeData.advantages,
        advantages: safeAdvantages.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
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
        products: [...safeProducts, newProduct],
      },
    }
    setData(updatedData)
  }

  const removeProduct = (id: string) => {
    const updatedData = {
      ...safeData,
      productGallery: {
        ...safeData.productGallery,
        products: safeProducts.filter((item) => item.id !== id),
      },
    }
    setData(updatedData)
  }

  const updateProduct = (id: string, field: string, value: string) => {
    const updatedData = {
      ...safeData,
      productGallery: {
        ...safeData.productGallery,
        products: safeProducts.map((item) => {
          if (item.id === id) {
            const updated = { ...item, [field]: value }
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

  const handleImageUpload = async (blockType: string, field: string, blockId?: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const reader = new FileReader()
          reader.onload = async () => {
            const fd = new FormData()
            fd.append("file", file)
            const response = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" })
            if (!response.ok) {
              console.error("[v0] Upload failed:", await response.text())
              return
            }
            const { url: permanentUrl } = await response.json()

            const updatedData = { ...safeData }
            if (blockType === "hero") {
              updatedData.hero = { ...updatedData.hero, [field]: permanentUrl }
            } else if (blockType === "cooperation") {
              updatedData.cooperation = { ...updatedData.cooperation, [field]: permanentUrl }
            } else if (blockType === "custom" && blockId) {
              updatedData.customBlocks = updatedData.customBlocks.map((block) =>
                block.id === blockId ? { ...block, [field]: permanentUrl } : block,
              )
            } else if (blockType === "product" && blockId) {
              updatedData.productGallery = {
                ...updatedData.productGallery,
                products: updatedData.productGallery.products.map((product) =>
                  product.id === blockId ? { ...product, image: permanentUrl } : product,
                ),
              }
            }
            setData(updatedData)

            console.log("[v0] Image uploaded for", blockType, field)
          }
          reader.readAsDataURL(file)
        } catch (error) {
          console.error("[v0] Image upload error:", error)
        }
      }
    }
    input.click()
  }

  const addHeroButton = () => {
    const newButton = {
      id: crypto.randomUUID(),
      text: "Новая кнопка",
      link: "/",
      variant: "secondary" as const,
    }

    const currentButtons = safeData.hero.buttons || []
    const updatedData = {
      ...safeData,
      hero: {
        ...safeData.hero,
        buttons: [...currentButtons, newButton],
      },
    }
    setData(updatedData)
  }

  const removeHeroButton = (buttonId: string) => {
    const updatedData = {
      ...safeData,
      hero: {
        ...safeData.hero,
        buttons: (safeData.hero.buttons || []).filter((button) => button.id !== buttonId),
      },
    }
    setData(updatedData)
  }

  const updateHeroButton = (buttonId: string, field: string, value: any) => {
    const updatedData = {
      ...safeData,
      hero: {
        ...safeData.hero,
        buttons: (safeData.hero.buttons || []).map((button) =>
          button.id === buttonId ? { ...button, [field]: value } : button,
        ),
      },
    }
    setData(updatedData)
  }

  const addCooperationFeature = () => {
    const newFeature = {
      id: crypto.randomUUID(),
      icon: "⭐",
      title: "Новое преимущество",
      description: "Описание преимущества",
    }
    const updatedData = {
      ...safeData,
      cooperation: {
        ...safeData.cooperation,
        features: [...safeCooperationFeatures, newFeature],
      },
    }
    setData(updatedData)
  }

  const removeCooperationFeature = (id: string) => {
    const currentFeatures = safeData.cooperation.features || []
    const updatedFeatures = currentFeatures.filter((feature) => feature.id !== id)
    updateField("cooperation", "features", updatedFeatures)
  }

  const updateCooperationFeature = (id: string, field: string, value: string) => {
    const updatedData = {
      ...safeData,
      cooperation: {
        ...safeData.cooperation,
        features: safeCooperationFeatures.map((item: any) => (item.id === id ? { ...item, [field]: value } : item)),
      },
    }
    setData(updatedData)
  }

  const addCooperationButton = () => {
    const newButton = {
      id: crypto.randomUUID(),
      text: "Новая кнопка",
      link: "/",
      variant: "secondary" as const,
    }

    const updatedData = {
      ...safeData,
      cooperation: {
        ...safeData.cooperation,
        buttons: [...safeCooperationButtons, newButton],
      },
    }
    setData(updatedData)
  }

  const removeCooperationButton = (buttonId: string) => {
    const updatedData = {
      ...safeData,
      cooperation: {
        ...safeData.cooperation,
        buttons: safeCooperationButtons.filter((button) => button.id !== buttonId),
      },
    }
    setData(updatedData)
  }

  const updateCooperationButton = (buttonId: string, field: string, value: any) => {
    const updatedData = {
      ...safeData,
      cooperation: {
        ...safeData.cooperation,
        buttons: safeCooperationButtons.map((button: any) =>
          button.id === buttonId ? { ...button, [field]: value } : button,
        ),
      },
    }
    setData(updatedData)
  }

  const saveAllData = async () => {
    setIsSaving(true)
    try {
      console.log("[v0] saveAllData - starting save...")
      console.log("[v0] saveAllData - data size:", JSON.stringify(safeData).length, "characters")
      
      const result = await saveAll(safeData)
      console.log("[v0] saveAllData - save completed successfully, result:", result)
      
      toast({
        title: "Сохранено",
        description: "Все изменения были успешно сохранены.",
      })
    } catch (error) {
      console.error("[v0] saveAllData - failed to save data:", error)
      
      let errorMessage = "Не удалось сохранить изменения. Попробуйте еще раз."
      if (error instanceof Error) {
        errorMessage = `Ошибка: ${error.message}`
      }
      
      toast({
        title: "Ошибка сохранения",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const uploadHeroBackground = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const uploadedUrl = await uploadImage(file)
          
          // Обновляем состояние
          updateField("hero", "backgroundImage", uploadedUrl)
          
          // Сразу сохраняем изменения
          const updatedData = {
            ...safeData,
            hero: {
              ...safeData.hero,
              backgroundImage: uploadedUrl,
            },
          }
          await saveAll(updatedData)
          
          console.log("[v0] Hero background image uploaded and saved")
          toast({
            title: "Изображение загружено",
            description: "Фоновое изображение успешно обновлено.",
          })
        } catch (error) {
          console.error("[v0] Error uploading hero background:", error)
          toast({
            title: "Ошибка загрузки",
            description: "Не удалось загрузить изображение. Попробуйте еще раз.",
            variant: "destructive",
          })
        }
      }
    }
    input.click()
  }

  const createCustomBlock = async () => {
    setIsCreatingBlock(true)

    const newBlock = {
      id: `custom-${Date.now()}`,
      type: "custom" as const,
      title: `Новый блок ${safeCustomBlocks.length + 1}`,
      subtitle: "Описание нового блока",
      description: "Подробное описание функционала блока",
      backgroundImage: "/fabric-texture-wall-panels.png",
      images: [],
      buttons: [],
      features: [],
      visible: true,
      order: safeCustomBlocks.length + 5,
    }

    const updatedData = {
      ...safeData,
      customBlocks: [...safeCustomBlocks, newBlock],
    }

    setData(updatedData)

    setTimeout(() => {
      startEditingBlockName(newBlock.id, newBlock.title)
      setIsCreatingBlock(false)
    }, 100)
  }

  const moveMainBlock = (blockKey: string, direction: "up" | "down") => {
    const currentIndex = safeBlockOrder.indexOf(blockKey)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (newIndex < 0 || newIndex >= safeBlockOrder.length) return

    const updatedBlockOrder = [...safeBlockOrder]
    updatedBlockOrder[currentIndex] = safeBlockOrder[newIndex]
    updatedBlockOrder[newIndex] = blockKey

    const updatedData = {
      ...safeData,
      blockOrder: updatedBlockOrder,
    }
    setData(updatedData)
  }

  const moveCustomBlock = (blockId: string, direction: "up" | "down") => {
    const currentIndex = safeCustomBlocks.findIndex((block) => block.id === blockId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

    if (newIndex < 0 || newIndex >= safeCustomBlocks.length) return

    const updatedBlocks = [...safeCustomBlocks]
    const temp = updatedBlocks[currentIndex]
    updatedBlocks[currentIndex] = updatedBlocks[newIndex]
    updatedBlocks[newIndex] = temp

    // Обновляем order для корректного отображения порядка
    updatedBlocks.forEach((block, index) => {
      block.order = index + 5 // Предполагаем, что основные блоки занимают первые 4 позиции
    })

    const updatedData = {
      ...safeData,
      customBlocks: updatedBlocks,
    }
    setData(updatedData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление главной страницей</h1>
          <p className="text-muted-foreground">Настройте содержимое и порядок блоков на главной странице</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={saveAllData} disabled={isSaving} className="flex items-center gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Сохранить все
          </Button>
          <Button variant="outline" onClick={() => window.open("/", "_blank")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            disabled={isPublishing}
            onClick={async () => {
              setIsPublishing(true)
              try {
                const res = await fetch("/api/pages/home/publish", { method: "POST", credentials: "include" })
                if (!res.ok) {
                  const errorText = await res.text()
                  console.error("[v0] Publish failed:", errorText)
                  toast({
                    title: "Ошибка публикации",
                    description: "Не удалось опубликовать страницу. Попробуйте еще раз.",
                    variant: "destructive",
                  })
                  return
                }
                console.log("[v0] Published")
                toast({
                  title: "Успешно опубликовано",
                  description: "Страница была успешно опубликована и теперь доступна посетителям.",
                })
              } catch (e) {
                console.error("[v0] Publish error:", e)
                toast({
                  title: "Ошибка публикации",
                  description: "Произошла ошибка при публикации. Попробуйте еще раз.",
                  variant: "destructive",
                })
              } finally {
                setIsPublishing(false)
              }
            }}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Публикация...
              </>
            ) : (
              "Опубликовать"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch("/api/pages/home/export", { credentials: "include" })
                if (!res.ok) {
                  console.error("[v0] Export failed:", await res.text())
                  return
                }
                const data = await res.json()
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "home-blocks.json"
                a.click()
                URL.revokeObjectURL(url)
              } catch (e) {
                console.error("[v0] Export error:", e)
              }
            }}
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "application/json"
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return
                try {
                  const text = await file.text()
                  const json = JSON.parse(text)
                  const res = await fetch("/api/pages/home/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(json),
                    credentials: "include",
                  })
                  if (!res.ok) {
                    console.error("[v0] Import failed:", await res.text())
                    return
                  }
                  console.log("[v0] Import success")
                } catch (err) {
                  console.error("[v0] Import error:", err)
                }
              }
              input.click()
            }}
          >
            Import JSON
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div>
          <h3 className="font-semibold text-orange-900">Дополнительные блоки</h3>
          <p className="text-sm text-orange-700">Создавайте дополнительные блоки для расширения функционала страницы</p>
        </div>
        <Button
          onClick={addCustomBlock}
          disabled={isCreatingBlock}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isCreatingBlock ? "Создание..." : "Создать новый блок"}
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <div className="space-y-4">
          <TabsList className={`grid w-full ${safeCustomBlocks.length > 0 ? "grid-cols-5" : "grid-cols-4"}`}>
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
            {safeCustomBlocks.length > 0 && (
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {safeCustomBlocks.length === 1 ? safeCustomBlocks[0].title : `Доп. блоки (${safeCustomBlocks.length})`}
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex justify-center">
            <TabsList className="w-auto">
              <TabsTrigger value="order" className="flex items-center gap-2 px-6">
                <MoveUp className="h-4 w-4" />
                Порядок блоков
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Hero Block */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hero блок</CardTitle>
                  <CardDescription>Главный баннер страницы со слайдером изображений</CardDescription>
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Кнопки действий</Label>
                  <Button size="sm" variant="outline" onClick={addHeroButton}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить кнопку
                  </Button>
                </div>

                {(safeData.hero.buttons || []).map((button, index) => (
                  <Card key={button.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Текст кнопки"
                            value={button.text}
                            onChange={(e) => updateHeroButton(button.id, "text", e.target.value)}
                          />
                          <Input
                            placeholder="Ссылка"
                            value={button.link}
                            onChange={(e) => updateHeroButton(button.id, "link", e.target.value)}
                          />
                          <Select
                            value={button.variant || "primary"}
                            onValueChange={(value) => updateHeroButton(button.id, "variant", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primary">Основная</SelectItem>
                              <SelectItem value="secondary">Вторичная</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeHeroButton(button.id)}
                        className="text-red-500 bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {/* Показываем старые поля для обратной совместимости, если нет новых кнопок */}
                {(!safeData.hero.buttons || safeData.hero.buttons.length === 0) && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                    <div className="space-y-2">
                      <Label htmlFor="hero-button">Текст кнопки (устаревшее)</Label>
                      <Input
                        id="hero-button"
                        value={safeData.hero.ctaText}
                        onChange={(e) => updateField("hero", "ctaText", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero-link">Ссылка кнопки (устаревшее)</Label>
                      <Input
                        id="hero-link"
                        value={safeData.hero.ctaLink}
                        onChange={(e) => updateField("hero", "ctaLink", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Основное фоновое изображение</Label>
                  <div className="flex items-center gap-4">
                    {safeData.hero.backgroundImage && (
                      <img
                        src={safeData.hero.backgroundImage || "/placeholder.svg"}
                        alt="Background preview"
                        className="w-32 h-20 object-cover rounded border"
                      />
                    )}
                    <Button size="sm" variant="outline" onClick={uploadHeroBackground}>
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить основное фото
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Дополнительные изображения для слайдера</Label>
                  <Button size="sm" variant="outline" onClick={addHeroImage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить изображение
                  </Button>
                </div>

                {(safeData.hero.images || []).length > 0 && (
                  <div className="grid grid-cols-6 gap-3 p-2 rounded border bg-white/50">
                    {(safeData.hero.images || []).map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Hero image ${index + 1}`}
                          className="w-full h-24 object-contain rounded border bg-white"
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

                {safeAdvantages.map((item) => (
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
                  {safeProducts.map((item) => (
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
                            <Input
                              placeholder="Ссылка на товар (/catalog/slug)"
                              value={item.link || ""}
                              onChange={(e) => updateProduct(item.id, "link", e.target.value)}
                            />
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
                  <CardDescription>Информация о партнерстве и предложениях</CardDescription>
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Заголовок</Label>
                  <Input
                    value={safeData.cooperation.title || ""}
                    onChange={(e) => updateField("cooperation", "title", e.target.value)}
                    placeholder="Заголовок блока"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Подзаголовок</Label>
                  <Input
                    value={safeData.cooperation.subtitle || ""}
                    onChange={(e) => updateField("cooperation", "subtitle", e.target.value)}
                    placeholder="Подзаголовок блока"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  value={safeData.cooperation.description || ""}
                  onChange={(e) => updateField("cooperation", "description", e.target.value)}
                  placeholder="Описание блока"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Преимущества</Label>
                  <Button size="sm" variant="outline" onClick={addCooperationFeature}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить преимущество
                  </Button>
                </div>

                {(safeData.cooperation.features || []).map((feature, index) => (
                  <div key={feature.id} className="flex items-start gap-4 p-4 border rounded">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={feature.title}
                        onChange={(e) => updateCooperationFeature(feature.id, "title", e.target.value)}
                        placeholder="Заголовок преимущества"
                      />
                      <Textarea
                        value={feature.description}
                        onChange={(e) => updateCooperationFeature(feature.id, "description", e.target.value)}
                        placeholder="Описание преимущества"
                        rows={2}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeCooperationFeature(feature.id)}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Кнопки действий</Label>
                  <Button size="sm" variant="outline" onClick={addCooperationButton}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить кнопку
                  </Button>
                </div>

                {(safeData.cooperation.buttons || []).map((button, index) => (
                  <div key={button.id} className="flex items-center gap-2">
                    <Input
                      value={button.text}
                      onChange={(e) => updateCooperationButton(button.id, "text", e.target.value)}
                      placeholder="Текст кнопки"
                      className="flex-1"
                    />
                    <Input
                      value={button.link}
                      onChange={(e) => updateCooperationButton(button.id, "link", e.target.value)}
                      placeholder="Ссылка"
                      className="flex-1"
                    />
                                         <Select
                       value={button.variant}
                       onValueChange={(value) => updateCooperationButton(button.id, "variant", value)}
                     >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Основная</SelectItem>
                        <SelectItem value="secondary">Вторичная</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeCooperationButton(button.id)}
                      className="text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Фоновое изображение</Label>
                <div className="flex items-center gap-4">
                  {safeData.cooperation.uploadedImage && (
                    <img
                      src={safeData.cooperation.uploadedImage || "/placeholder.svg"}
                      alt="Cooperation background"
                      className="w-32 h-20 object-cover rounded border"
                    />
                  )}
                  <Button size="sm" variant="outline" onClick={uploadCooperationImage}>
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить изображение
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Blocks */}
        {safeCustomBlocks.length > 0 && (
          <TabsContent value="custom">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Дополнительные блоки</h3>
                  <p className="text-sm text-muted-foreground">Управление пользовательскими блоками</p>
                </div>
                <Button onClick={createCustomBlock}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать новый блок
                </Button>
              </div>

              {safeCustomBlocks.map((block) => (
                <Card key={block.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>
                          {/* {block.title} */}
                          {/* Улучшаю отображение редактирования названия блока */}
                          {editingBlockId === block.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingBlockName}
                                onChange={(e) => setEditingBlockName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveBlockName(block.id)
                                  } else if (e.key === "Escape") {
                                    setEditingBlockId(null)
                                    setEditingBlockName("")
                                  }
                                }}
                                className="text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => saveBlockName(block.id)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingBlockId(null)
                                  setEditingBlockName("")
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{block.title}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingBlockName(block.id, block.title)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </CardTitle>
                        <CardDescription>Пользовательский блок</CardDescription>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={block.visible ? "default" : "secondary"}>
                          {block.visible ? "Видимый" : "Скрытый"}
                        </Badge>
                        <Switch
                          checked={block.visible}
                          onCheckedChange={(checked) => {
                            const updatedBlocks = safeCustomBlocks.map((b) =>
                              b.id === block.id ? { ...b, visible: checked } : b,
                            )
                            updateField("customBlocks", "", updatedBlocks)
                          }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Заголовок</Label>
                        <Input
                          value={block.title}
                          onChange={(e) => {
                            const updatedBlocks = safeCustomBlocks.map((b) =>
                              b.id === block.id ? { ...b, title: e.target.value } : b,
                            )
                            updateField("customBlocks", "", updatedBlocks)
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Подзаголовок</Label>
                        <Input
                          value={block.subtitle || ""}
                          onChange={(e) => {
                            const updatedBlocks = safeCustomBlocks.map((b) =>
                              b.id === block.id ? { ...b, subtitle: e.target.value } : b,
                            )
                            updateField("customBlocks", "", updatedBlocks)
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Описание</Label>
                      <Textarea
                        value={block.description || ""}
                        onChange={(e) => {
                          const updatedBlocks = safeCustomBlocks.map((b) =>
                            b.id === block.id ? { ...b, description: e.target.value } : b,
                          )
                          updateField("customBlocks", "", updatedBlocks)
                        }}
                      />
                    </div>

                    {/* Изображения для блока */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Изображения блока</Label>
                        <Button size="sm" variant="outline" onClick={() => addCustomBlockImage(block.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Добавить изображение
                        </Button>
                      </div>

                      {(block.images || []).length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {(block.images || []).map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`Block image ${index + 1}`}
                                className="w-full h-24 object-cover rounded border"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const updatedBlocks = safeCustomBlocks.map((b) => {
                                    if (b.id === block.id) {
                                      const updatedImages = (b.images || []).filter((_, i) => i !== index)
                                      return { ...b, images: updatedImages }
                                    }
                                    return b
                                  })
                                  updateField("customBlocks", "", updatedBlocks)
                                }}
                                className="absolute top-1 right-1 h-6 w-6 p-0 text-red-500"
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
                  {safeBlockOrder.map((blockKey, index) => {
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
                            disabled={index === safeBlockOrder.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {safeCustomBlocks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Дополнительные блоки</h4>
                  <div className="space-y-2">
                    {safeCustomBlocks
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
                              disabled={index === safeCustomBlocks.length - 1}
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
