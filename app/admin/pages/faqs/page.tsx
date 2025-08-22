"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface FAQ {
  id: string
  question: string
  answer: string
}

interface FAQsPageData {
  pageTitle: string
  seoTitle: string
  description: string
  seoDescription: string
  heroTitle: string
  heroSubtitle: string
  faqs: FAQ[]
}

export default function FAQsPageAdmin() {
  const [data, setData] = useState<FAQsPageData>({
    pageTitle: "FAQs",
    seoTitle: "Frequently Asked Questions - Stick'N'Style",
    description: "Find answers to common questions about our products and services",
    seoDescription:
      "Get answers to frequently asked questions about Stick'N'Style wall panels, flooring, and installation services",
    heroTitle: "Frequently Asked Questions",
    heroSubtitle: "Everything you need to know about our products and services",
    faqs: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch("/api/pages/faqs")
      if (response.ok) {
        const result = await response.json()
        setData(result.data || data)
      }
    } catch (error) {
      console.error("Error loading FAQs page:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveData = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/pages/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      })
      if (response.ok) {
        console.log("FAQs page saved successfully")
      }
    } catch (error) {
      console.error("Error saving FAQs page:", error)
    } finally {
      setSaving(false)
    }
  }

  const addFAQ = () => {
    const newFAQ: FAQ = {
      id: Date.now().toString(),
      question: "",
      answer: "",
    }
    setData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, newFAQ],
    }))
  }

  const updateFAQ = (id: string, field: keyof FAQ, value: string) => {
    setData((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq)),
    }))
  }

  const removeFAQ = (id: string) => {
    setData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((faq) => faq.id !== id),
    }))
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">FAQs Page</h1>
        <Button onClick={saveData} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pageTitle">Page Title</Label>
              <Input
                id="pageTitle"
                value={data.pageTitle}
                onChange={(e) => setData((prev) => ({ ...prev, pageTitle: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={data.seoTitle}
                onChange={(e) => setData((prev) => ({ ...prev, seoTitle: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              value={data.seoDescription}
              onChange={(e) => setData((prev) => ({ ...prev, seoDescription: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="heroTitle">Hero Title</Label>
            <Input
              id="heroTitle"
              value={data.heroTitle}
              onChange={(e) => setData((prev) => ({ ...prev, heroTitle: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
            <Textarea
              id="heroSubtitle"
              value={data.heroSubtitle}
              onChange={(e) => setData((prev) => ({ ...prev, heroSubtitle: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            FAQs
            <Button onClick={addFAQ} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.faqs.map((faq) => (
            <div key={faq.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Question</Label>
                <Button variant="outline" size="sm" onClick={() => removeFAQ(faq.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Input
                value={faq.question}
                onChange={(e) => updateFAQ(faq.id, "question", e.target.value)}
                placeholder="Enter question..."
              />
              <div>
                <Label>Answer</Label>
                <Textarea
                  value={faq.answer}
                  onChange={(e) => updateFAQ(faq.id, "answer", e.target.value)}
                  placeholder="Enter answer..."
                  rows={3}
                />
              </div>
            </div>
          ))}
          {data.faqs.length === 0 && (
            <p className="text-gray-500 text-center py-8">No FAQs added yet. Click "Add FAQ" to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
