"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Save, Globe, Edit3 } from "lucide-react"

interface Product {
  id: number
  name: string
  description: string
  specifications: string
}

interface Language {
  code: string
  name: string
  flag_icon: string
  is_active: boolean
}

interface Translation {
  product_id: number
  language_code: string
  name: string
  description: string
  specifications: string
  status: "translated" | "default" | "missing"
}

export default function BulkTranslationsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [translations, setTranslations] = useState<Translation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCell, setEditingCell] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      console.log("[v0] Loading bulk translations data...")

      // Load products
      const productsRes = await fetch("/api/translations/products/list")
      const productsData = await productsRes.json()
      const productsList = productsData.success ? productsData.data : []

      // Load languages
      const languagesRes = await fetch("/api/languages")
      const languagesData = await languagesRes.json()
      const languagesList = Array.isArray(languagesData) ? languagesData : languagesData.data || []

      // Load all translations
      const translationsRes = await fetch("/api/translations/bulk")
      const translationsData = await translationsRes.json()
      const translationsList = translationsData.success ? translationsData.data : []

      setProducts(productsList)
      setLanguages(languagesList.filter((lang) => lang.is_active))
      setTranslations(translationsList)

      console.log("[v0] Bulk data loaded:", {
        products: productsList.length,
        languages: languagesList.length,
        translations: translationsList.length,
      })
    } catch (error) {
      console.error("[v0] Error loading bulk translations:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTranslation = (productId: number, languageCode: string, field: string) => {
    const translation = translations.find((t) => t.product_id === productId && t.language_code === languageCode)
    return translation ? translation[field as keyof Translation] : ""
  }

  const updateTranslation = (productId: number, languageCode: string, field: string, value: string) => {
    setTranslations((prev) => {
      const existing = prev.find((t) => t.product_id === productId && t.language_code === languageCode)

      if (existing) {
        return prev.map((t) =>
          t.product_id === productId && t.language_code === languageCode
            ? { ...t, [field]: value, status: "translated" as const }
            : t,
        )
      } else {
        const product = products.find((p) => p.id === productId)
        return [
          ...prev,
          {
            product_id: productId,
            language_code: languageCode,
            name: field === "name" ? value : product?.name || "",
            description: field === "description" ? value : product?.description || "",
            specifications: field === "specifications" ? value : product?.specifications || "",
            status: "translated" as const,
          },
        ]
      }
    })
  }

  const saveAllTranslations = async () => {
    setSaving(true)
    try {
      console.log("[v0] Saving bulk translations...")

      const response = await fetch("/api/translations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations }),
      })

      const result = await response.json()
      if (result.success) {
        console.log("[v0] Bulk translations saved successfully")
        alert("All translations saved successfully!")
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("[v0] Error saving bulk translations:", error)
      alert("Error saving translations. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Product ID",
      "Product Name (EN)",
      ...languages.flatMap((lang) => [
        `Name (${lang.code})`,
        `Description (${lang.code})`,
        `Specifications (${lang.code})`,
      ]),
    ]

    const rows = products.map((product) => [
      product.id,
      product.name,
      ...languages.flatMap((lang) => [
        getTranslation(product.id, lang.code, "name") || product.name,
        getTranslation(product.id, lang.code, "description") || product.description,
        getTranslation(product.id, lang.code, "specifications") || product.specifications,
      ]),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "translations.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Globe className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading translations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Bulk Translation Management
          </h1>
          <p className="text-muted-foreground mt-2">Manage all product translations in a single table view</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={saveAllTranslations} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Translation Matrix</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click any cell to edit. Changes are highlighted and saved in bulk.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Field</th>
                  {languages.map((lang) => (
                    <th key={lang.code} className="text-left p-3 font-medium min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lang.flag_icon}</span>
                        <span>{lang.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {lang.code.toUpperCase()}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) =>
                  ["name", "description", "specifications"].map((field) => (
                    <tr key={`${product.id}-${field}`} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{field === "name" && product.name}</td>
                      <td className="p-3 capitalize text-sm text-muted-foreground">{field}</td>
                      {languages.map((lang) => {
                        const cellId = `${product.id}-${lang.code}-${field}`
                        const value = getTranslation(product.id, lang.code, field) as string
                        const isEditing = editingCell === cellId
                        const hasTranslation = translations.some(
                          (t) =>
                            t.product_id === product.id &&
                            t.language_code === lang.code &&
                            t[field as keyof Translation] !== (product as any)[field],
                        )

                        return (
                          <td key={lang.code} className="p-1">
                            {isEditing ? (
                              field === "description" || field === "specifications" ? (
                                <Textarea
                                  value={value || (product as any)[field] || ""}
                                  onChange={(e) => updateTranslation(product.id, lang.code, field, e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") setEditingCell(null)
                                  }}
                                  className="min-h-[80px] text-sm"
                                  autoFocus
                                />
                              ) : (
                                <Input
                                  value={value || (product as any)[field] || ""}
                                  onChange={(e) => updateTranslation(product.id, lang.code, field, e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === "Escape") setEditingCell(null)
                                  }}
                                  className="text-sm"
                                  autoFocus
                                />
                              )
                            ) : (
                              <div
                                onClick={() => setEditingCell(cellId)}
                                className={`p-2 rounded cursor-pointer hover:bg-muted/50 min-h-[40px] flex items-center ${
                                  hasTranslation ? "bg-lime-50 border border-lime-200" : "bg-gray-50"
                                }`}
                              >
                                <div className="flex-1">
                                  <p className="text-sm">
                                    {value || (product as any)[field] || "Click to add translation"}
                                  </p>
                                  {hasTranslation && (
                                    <Badge variant="secondary" className="text-xs mt-1">
                                      Translated
                                    </Badge>
                                  )}
                                </div>
                                <Edit3 className="h-3 w-3 opacity-50" />
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
