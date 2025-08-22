"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Save, Trash2, Edit } from "lucide-react"
import { toast } from "sonner"

type Language = {
  id: string
  code: string
  name: string
  native_name: string
  flag_icon: string
  is_active: boolean
  is_default: boolean
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null)
  const [newLanguage, setNewLanguage] = useState({
    code: "",
    name: "",
    native_name: "",
    flag_icon: "",
  })

  useEffect(() => {
    loadLanguages()
  }, [])

  const loadLanguages = async () => {
    try {
      console.log("[v0] Loading languages from API...")
      const response = await fetch("/api/languages")
      const result = await response.json()

      if (result.success) {
        setLanguages(result.data || [])
        console.log("[v0] Languages loaded:", result.data?.length || 0)
      } else {
        toast.error("Failed to load languages")
      }
    } catch (error) {
      console.error("[v0] Error loading languages:", error)
      toast.error("Failed to load languages")
    }
  }

  const handleLanguageToggle = (languageId: string, isActive: boolean) => {
    // Check that we don't disable the last active language
    const activeLanguages = languages.filter((lang) => lang.is_active)
    if (activeLanguages.length === 1 && !isActive) {
      toast.error("At least one language must remain active")
      return
    }

    setLanguages((prev) => prev.map((lang) => (lang.id === languageId ? { ...lang, is_active: isActive } : lang)))
    setHasChanges(true)
  }

  const handleSaveChanges = async () => {
    setLoading(true)
    try {
      console.log("[v0] Saving language changes...")

      const response = await fetch("/api/languages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languages: languages.map((lang) => ({
            id: lang.id,
            isActive: lang.is_active,
            isDefault: lang.is_default,
          })),
        }),
      })

      const result = await response.json()
      if (result.success) {
        setHasChanges(false)
        toast.success("Changes saved successfully")
        console.log("[v0] All changes saved successfully")
      } else {
        toast.error("Failed to save changes")
      }
    } catch (error) {
      console.error("[v0] Error saving changes:", error)
      toast.error("Failed to save changes")
    } finally {
      setLoading(false)
    }
  }

  const handleEditLanguage = (language: Language) => {
    setEditingLanguage(language)
    setShowEditDialog(true)
  }

  const handleSaveEditedLanguage = async () => {
    if (!editingLanguage || !editingLanguage.code || !editingLanguage.name || !editingLanguage.native_name) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Updating language:", editingLanguage.id)
      const response = await fetch(`/api/languages/${editingLanguage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editingLanguage.code.toLowerCase(),
          name: editingLanguage.name,
          native_name: editingLanguage.native_name,
          flag_icon: editingLanguage.flag_icon,
        }),
      })

      const result = await response.json()
      if (result.success) {
        await loadLanguages() // Reload languages
        setShowEditDialog(false)
        setEditingLanguage(null)
        toast.success("Language updated successfully")
      } else {
        toast.error("Failed to update language")
      }
    } catch (error) {
      console.error("[v0] Error updating language:", error)
      toast.error("Failed to update language")
    } finally {
      setLoading(false)
    }
  }

  const handleAddLanguage = async () => {
    if (!newLanguage.code || !newLanguage.name || !newLanguage.native_name) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Adding new language:", newLanguage)
      const response = await fetch("/api/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newLanguage.code.toLowerCase(),
          name: newLanguage.name,
          native_name: newLanguage.native_name,
          flag_icon: newLanguage.flag_icon || "🌐",
          is_active: true,
          is_default: false,
        }),
      })

      const result = await response.json()
      if (result.success) {
        await loadLanguages() // Reload languages
        setShowAddDialog(false)
        setNewLanguage({ code: "", name: "", native_name: "", flag_icon: "" })
        toast.success("Language added successfully")
      } else {
        toast.error("Failed to add language")
      }
    } catch (error) {
      console.error("[v0] Error adding language:", error)
      toast.error("Failed to add language")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLanguage = async (languageId: string, languageName: string) => {
    if (!confirm(`Are you sure you want to delete "${languageName}"? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Deleting language:", languageId)
      const response = await fetch(`/api/languages/${languageId}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        await loadLanguages() // Reload languages
        toast.success("Language deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete language")
      }
    } catch (error) {
      console.error("[v0] Error deleting language:", error)
      toast.error("Failed to delete language")
    } finally {
      setLoading(false)
    }
  }

  const activeLanguagesCount = languages.filter((lang) => lang.is_active).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Language Management</h1>
          <p className="text-muted-foreground">
            Manage available languages for the website. Language switcher visibility is controlled in Navigation
            Settings.
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleSaveChanges} disabled={loading} className="bg-lime-500 hover:bg-lime-600">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-lime-500 hover:bg-lime-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Language
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Language</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Language Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., fr, de, it"
                    value={newLanguage.code}
                    onChange={(e) => setNewLanguage((prev) => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="name">English Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., French, German, Italian"
                    value={newLanguage.name}
                    onChange={(e) => setNewLanguage((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="native_name">Native Name *</Label>
                  <Input
                    id="native_name"
                    placeholder="e.g., Français, Deutsch, Italiano"
                    value={newLanguage.native_name}
                    onChange={(e) => setNewLanguage((prev) => ({ ...prev, native_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="flag_icon">Flag Icon</Label>
                  <Input
                    id="flag_icon"
                    placeholder="e.g., 🇫🇷, 🇩🇪, 🇮🇹"
                    value={newLanguage.flag_icon}
                    onChange={(e) => setNewLanguage((prev) => ({ ...prev, flag_icon: e.target.value }))}
                  />
                </div>
                <Button onClick={handleAddLanguage} disabled={loading} className="w-full">
                  Add Language
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Languages Management */}
      <Card>
        <CardHeader>
          <CardTitle>Available Languages</CardTitle>
          <p className="text-sm text-muted-foreground">
            {activeLanguagesCount} of {languages.length} languages active
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {languages.map((language) => (
              <div key={language.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{language.flag_icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{language.name}</p>
                      <p className="text-muted-foreground">({language.native_name})</p>
                      {language.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Language code: {language.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{language.is_active ? "Active" : "Inactive"}</span>
                    <Switch
                      checked={language.is_active}
                      onCheckedChange={(checked) => handleLanguageToggle(language.id, checked)}
                      disabled={loading || language.is_default}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLanguage(language)}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!language.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLanguage(language.id, language.name)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Language</DialogTitle>
          </DialogHeader>
          {editingLanguage && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_code">Language Code *</Label>
                <Input
                  id="edit_code"
                  placeholder="e.g., fr, de, it"
                  value={editingLanguage.code}
                  onChange={(e) => setEditingLanguage((prev) => (prev ? { ...prev, code: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="edit_name">English Name *</Label>
                <Input
                  id="edit_name"
                  placeholder="e.g., French, German, Italian"
                  value={editingLanguage.name}
                  onChange={(e) => setEditingLanguage((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="edit_native_name">Native Name *</Label>
                <Input
                  id="edit_native_name"
                  placeholder="e.g., Français, Deutsch, Italiano"
                  value={editingLanguage.native_name}
                  onChange={(e) =>
                    setEditingLanguage((prev) => (prev ? { ...prev, native_name: e.target.value } : null))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit_flag_icon">Flag Icon</Label>
                <Input
                  id="edit_flag_icon"
                  placeholder="e.g., 🇫🇷, 🇩🇪, 🇮🇹"
                  value={editingLanguage.flag_icon}
                  onChange={(e) => setEditingLanguage((prev) => (prev ? { ...prev, flag_icon: e.target.value } : null))}
                />
              </div>
              <Button onClick={handleSaveEditedLanguage} disabled={loading} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
