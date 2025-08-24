"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CSVImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function CSVImportDialog({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) {
  const { toast } = useToast()
  const [csvContent, setCsvContent] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCsvContent(content)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast({ title: "No content", description: "Please paste CSV content or upload a file", variant: "destructive" })
      return
    }

    setIsImporting(true)
    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()
      
      toast({ 
        title: "Import successful", 
        description: `Created: ${result.results.created}, Updated: ${result.results.updated}, Errors: ${result.results.errors.length}` 
      })

      if (result.results.errors.length > 0) {
        console.warn('Import errors:', result.results.errors)
      }

      setCsvContent("")
      onImportComplete()
      onOpenChange(false)
    } catch (error) {
      console.error('Import failed:', error)
      toast({ 
        title: "Import failed", 
        description: error instanceof Error ? error.message : "Failed to import products", 
        variant: "destructive" 
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <div className="flex items-center gap-2">
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-content">Or Paste CSV Content</Label>
            <Textarea
              id="csv-content"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste your CSV content here..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">CSV Format Requirements:</p>
                <ul className="mt-1 space-y-1">
                  <li>• First row must contain headers: SKU, Product Name, Description, Category, Subcategory, etc.</li>
                  <li>• Sizes and Thicknesses should be comma-separated values</li>
                  <li>• Colors should be comma-separated values</li>
                  <li>• Products with existing SKU will be updated, new SKUs will be created</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !csvContent.trim()}
            >
              {isImporting ? (
                <>
                  <FileText className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Products
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

