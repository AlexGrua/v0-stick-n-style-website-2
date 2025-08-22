"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface CreateOrderPageData {
  pageTitle: string
  seoTitle: string
  description: string
  seoDescription: string
  heroTitle: string
  heroSubtitle: string
  features: string[]
  formSettings: {
    enableFileUpload: boolean
    enableMeasurements: boolean
    enableRoomType: boolean
    enableDeadline: boolean
    requirePhone: boolean
    requireAddress: boolean
  }
  thankYouMessage: string
}

export default function CreateOrderPageAdmin() {
  const [data, setData] = useState<CreateOrderPageData>({
    pageTitle: "Create'N'Order",
    seoTitle: "Custom Order Service - Stick'N'Style",
    description: "Create your custom order with our expert consultation service",
    seoDescription: "Get personalized consultation and custom orders for wall panels and flooring solutions",
    heroTitle: "Create Your Custom Order",
    heroSubtitle: "Get expert consultation and personalized solutions for your space",
    features: [
      "Free consultation with design experts",
      "Custom measurements and planning",
      "Professional installation service",
      "Quality guarantee on all products",
    ],
    formSettings: {
      enableFileUpload: true,
      enableMeasurements: true,
      enableRoomType: true,
      enableDeadline: true,
      requirePhone: true,
      requireAddress: false,
    },
    thankYouMessage: "Thank you for your order request! Our team will contact you within 24 hours.",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch("/api/pages/create-order")
      if (response.ok) {
        const result = await response.json()
        setData(result.data || data)
      }
    } catch (error) {
      console.error("Error loading Create Order page:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveData = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/pages/create-order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      })
      if (response.ok) {
        console.log("Create Order page saved successfully")
      }
    } catch (error) {
      console.error("Error saving Create Order page:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create'N'Order Page</h1>
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
          <CardTitle>Form Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enableFileUpload"
                checked={data.formSettings.enableFileUpload}
                onCheckedChange={(checked) =>
                  setData((prev) => ({
                    ...prev,
                    formSettings: { ...prev.formSettings, enableFileUpload: checked },
                  }))
                }
              />
              <Label htmlFor="enableFileUpload">Enable File Upload</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enableMeasurements"
                checked={data.formSettings.enableMeasurements}
                onCheckedChange={(checked) =>
                  setData((prev) => ({
                    ...prev,
                    formSettings: { ...prev.formSettings, enableMeasurements: checked },
                  }))
                }
              />
              <Label htmlFor="enableMeasurements">Enable Measurements</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requirePhone"
                checked={data.formSettings.requirePhone}
                onCheckedChange={(checked) =>
                  setData((prev) => ({
                    ...prev,
                    formSettings: { ...prev.formSettings, requirePhone: checked },
                  }))
                }
              />
              <Label htmlFor="requirePhone">Require Phone Number</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="requireAddress"
                checked={data.formSettings.requireAddress}
                onCheckedChange={(checked) =>
                  setData((prev) => ({
                    ...prev,
                    formSettings: { ...prev.formSettings, requireAddress: checked },
                  }))
                }
              />
              <Label htmlFor="requireAddress">Require Address</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thank You Message</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.thankYouMessage}
            onChange={(e) => setData((prev) => ({ ...prev, thankYouMessage: e.target.value }))}
            placeholder="Message shown after form submission..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  )
}
