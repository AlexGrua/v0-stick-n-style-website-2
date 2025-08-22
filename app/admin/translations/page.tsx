"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Edit, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Language {
  code: string
  name: string
  flag_icon: string
  is_active: boolean
}

interface Product {
  id: number
  sku: string
  name: string
  description: string
  specifications: any
}

interface Translation {
  id?: number
  language_code: string
  name: string
  description: string
  specifications?: any
}

export default function TranslationsPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [translation, setTranslation] = useState<Translation>({
    language_code: "",
    name: "",
    description: "",
    specifications: {},
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Загрузка языков
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch("/api/languages")
        const data = await response.json()

        let languagesArray = []
        if (Array.isArray(data)) {
          languagesArray = data
        } else if (data && Array.isArray(data.data)) {
          languagesArray = data.data
        } else if (data && data.languages && Array.isArray(data.languages)) {
          languagesArray = data.languages
        } else {
          console.error("[v0] Unexpected languages data format:", data)
          languagesArray = []
        }

        const activeLanguages = languagesArray.filter((lang: Language) => lang.is_active)
        setLanguages(activeLanguages)
        console.log("[v0] Active languages loaded:", activeLanguages.length)
      } catch (error) {
        console.error("[v0] Error loading languages:", error)
        setLanguages([]) // Ensure languages is always an array on error
      }
    }
    fetchLanguages()
  }, [])

  // Загрузка продуктов
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/translations/products/list")
        const data = await response.json()

        const productsArray = data.success ? data.data : []
        setProducts(productsArray || [])
        console.log("[v0] Products loaded:", productsArray?.length || 0)
      } catch (error) {
        console.error("[v0] Error loading products:", error)
        setProducts([]) // Ensure products is always an array on error
      }
    }
    fetchProducts()
  }, [])

  // Загрузка перевода для выбранного продукта и языка
  const loadTranslation = async (productId: number, languageCode: string) => {
    if (!productId || !languageCode) return

    setLoading(true)
    try {
      const response = await fetch(`/api/translations/products?id=${productId}&lang=${languageCode}`)
      const data = await response.json()

      if (data.id) {
        setTranslation(data)
        console.log("[v0] Translation loaded:", data)
      } else {
        // Если перевода нет, создаем пустой на основе английской версии
        const product = products.find((p) => p.id === productId)
        setTranslation({
          language_code: languageCode,
          name: product?.name || "",
          description: product?.description || "",
          specifications: product?.specifications || {},
        })
        console.log("[v0] No translation found, created empty template")
      }
    } catch (error) {
      console.error("[v0] Error loading translation:", error)
    } finally {
      setLoading(false)
    }
  }

  // Сохранение перевода
  const saveTranslation = async () => {
    if (!selectedProduct || !selectedLanguage) return

    setSaving(true)
    try {
      const response = await fetch("/api/translations/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          language_code: selectedLanguage,
          name: translation.name,
          description: translation.description,
          specifications: translation.specifications,
        }),
      })

      if (response.ok) {
        console.log("[v0] Translation saved successfully")
        setEditDialogOpen(false)
      } else {
        console.error("[v0] Error saving translation")
      }
    } catch (error) {
      console.error("[v0] Error saving translation:", error)
    } finally {
      setSaving(false)
    }
  }

  // Обработка выбора продукта и языка
  const handleProductLanguageSelect = (productId: number, languageCode: string) => {
    const product = products.find((p) => p.id === productId)
    setSelectedProduct(product || null)
    setSelectedLanguage(languageCode)
    loadTranslation(productId, languageCode)
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Content Translations</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Translations</CardTitle>
          <CardDescription>
            Translate your content into different languages. Select a product and language to start translating.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products" className="space-y-4">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <div className="grid gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription>SKU: {product.sku}</CardDescription>
                        </div>
                        <Badge variant="outline">{product.sku}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {languages.map((language) => (
                          <Button
                            key={language.code}
                            variant="outline"
                            size="sm"
                            onClick={() => handleProductLanguageSelect(product.id, language.code)}
                            className="flex items-center gap-2"
                          >
                            <span className="text-lg">{language.flag_icon}</span>
                            <span>{language.name}</span>
                            <Edit className="h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Category translations will be available soon. The system is being prepared to handle category
                      content translations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pages" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Page translations will be available soon. This will include homepage, about us, and other static
                      content.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Диалог редактирования перевода */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Translation: {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Translating to: {languages.find((l) => l.code === selectedLanguage)?.name}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={translation.name}
                  onChange={(e) => setTranslation((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter translated product name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={translation.description}
                  onChange={(e) => setTranslation((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter translated description"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveTranslation} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Translation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
