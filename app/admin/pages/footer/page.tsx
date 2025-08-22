"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

type FooterData = {
  contact: {
    address: string
    phone: string
    email: string
  }
  socialMedia: {
    whatsapp: string
    telegram: string
    wechat: string
    instagram: string
  }
  quickLinks: string[]
  inquiryForm: {
    title: string
    phonePlaceholder: string
    questionPlaceholder: string
    buttonText: string
  }
  copyright: string
  messengerWidget: string
}

const defaultData: FooterData = {
  contact: {
    address: "Shenzhen, China",
    phone: "+86 123 456 789",
    email: "hello@sticknstyle.com",
  },
  socialMedia: {
    whatsapp: "",
    telegram: "",
    wechat: "",
    instagram: "",
  },
  quickLinks: ["FAQs", "Shipping & Logistics", "Quality & Warranty", "Become a Partner"],
  inquiryForm: {
    title: "Mini inquiry",
    phonePlaceholder: "Phone or Email",
    questionPlaceholder: "Your question",
    buttonText: "Send",
  },
  copyright: "Stick'N'Style. All rights reserved.",
  messengerWidget: "Embedded messenger widget placeholder",
}

export default function FooterAdmin() {
  const { toast } = useToast()
  const [data, setData] = useState<FooterData>(defaultData)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await fetch("/api/footer")
      if (res.ok) {
        const footerData = await res.json()
        setData({ ...defaultData, ...footerData })
      }
    } catch (error) {
      console.error("Failed to load footer data:", error)
    }
  }

  async function saveData() {
    setLoading(true)
    try {
      const res = await fetch("/api/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast({ title: "Saved", description: "Footer updated successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Footer Settings</h1>
        <Button onClick={saveData} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={data.contact.address}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, address: e.target.value },
                  }))
                }
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={data.contact.phone}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={data.contact.email}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Quick Links</h2>
          <div className="grid gap-2">
            <Label>Links (one per line)</Label>
            <Textarea
              value={data.quickLinks.join("\n")}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  quickLinks: e.target.value.split("\n").filter((link) => link.trim()),
                }))
              }
              rows={4}
              placeholder="FAQs&#10;Shipping & Logistics&#10;Quality & Warranty&#10;Become a Partner"
            />
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Inquiry Form</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="inquiryTitle">Form Title</Label>
              <Input
                id="inquiryTitle"
                value={data.inquiryForm.title}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    inquiryForm: { ...prev.inquiryForm, title: e.target.value },
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={data.inquiryForm.buttonText}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    inquiryForm: { ...prev.inquiryForm, buttonText: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Copyright</h2>
          <div className="grid gap-2">
            <Label htmlFor="copyright">Copyright Text</Label>
            <Input
              id="copyright"
              value={data.copyright}
              onChange={(e) => setData((prev) => ({ ...prev, copyright: e.target.value }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
