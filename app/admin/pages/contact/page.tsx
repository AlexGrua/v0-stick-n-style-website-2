"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

type ContactPageData = {
  title: string
  description: string
  seoTitle: string
  seoDescription: string
  heroTitle: string
  heroSubtitle: string
  address: string
  phone: string
  email: string
  workingHours: string
  mapEmbedUrl: string
}

const defaultData: ContactPageData = {
  title: "Contact Us",
  description: "Get in touch with our team",
  seoTitle: "Contact Us - Stick'N'Style",
  seoDescription: "Contact Stick'N'Style for inquiries about our premium interior solutions",
  heroTitle: "Contact Us",
  heroSubtitle: "We're here to help with your interior design needs",
  address: "Shenzhen, China",
  phone: "+86 123 456 789",
  email: "hello@sticknstyle.com",
  workingHours: "Monday - Friday: 9:00 AM - 6:00 PM",
  mapEmbedUrl: "",
}

export default function ContactPageAdmin() {
  const { toast } = useToast()
  const [data, setData] = useState<ContactPageData>(defaultData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await fetch("/api/pages/contact")
      if (res.ok) {
        const pageData = await res.json()
        if (pageData.content) {
          const parsed = JSON.parse(pageData.content)
          setData({ ...defaultData, ...parsed })
        }
      }
    } catch (error) {
      console.error("Failed to load contact page data:", error)
    }
  }

  async function saveData() {
    setLoading(true)
    try {
      const res = await fetch("/api/pages/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          path: "/contact",
          content: JSON.stringify(data),
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          visible: true,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast({ title: "Saved", description: "Contact page updated successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contact Us Page</h1>
        <Button onClick={saveData} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={data.address}
                onChange={(e) => setData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={data.phone}
                onChange={(e) => setData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={data.email}
                onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workingHours">Working Hours</Label>
              <Input
                id="workingHours"
                value={data.workingHours}
                onChange={(e) => setData((prev) => ({ ...prev, workingHours: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
