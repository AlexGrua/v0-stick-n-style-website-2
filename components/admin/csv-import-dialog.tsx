"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle, Download, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function CSVImportDialog({ open, onOpenChange, onImportComplete }: ExcelImportDialogProps) {
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [showErrors, setShowErrors] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload an Excel file (.xlsx or .xls)", 
        variant: "destructive" 
      })
      return
    }

    setSelectedFile(file)
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/products/template')
      if (!response.ok) throw new Error('Failed to download template')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'products-import-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({ title: "Template downloaded", description: "Excel template ready for import" })
    } catch (error) {
      console.error('Template download failed:', error)
      toast({ 
        title: "Download failed", 
        description: "Failed to download template", 
        variant: "destructive" 
      })
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select an Excel file", variant: "destructive" })
      return
    }

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()
      
             if (result.results.errors.length > 0) {
         toast({ 
           title: "Import completed with errors", 
           description: `Created: ${result.results.created}, Updated: ${result.results.updated}, Errors: ${result.results.errors.length}. Check details below.` 
         })
       } else {
         toast({ 
           title: "Import successful", 
           description: `Created: ${result.results.created}, Updated: ${result.results.updated}` 
         })
       }

             if (result.results.errors.length > 0) {
         console.warn('Import errors:', result.results.errors)
         setImportErrors(result.results.errors)
         setShowErrors(true)
         // Не показываем toast с ошибкой, так как у нас есть модальное окно с деталями
       }

      setSelectedFile(null)
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" aria-describedby="import-description">
          <DialogHeader>
            <DialogTitle>Import Products from Excel</DialogTitle>
            <div id="import-description" className="sr-only">
              Import products from Excel file with validation and preview
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Upload Excel File</Label>
              <div className="flex items-center gap-2">
                <input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-green-600">
                  ✓ Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Excel Import Requirements:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Use the template format with required headers</li>
                    <li>• Multiple rows with same SKU will be grouped into one product</li>
                    <li>• Each row represents different size/thickness/color combination</li>
                    <li>• All imported products will be set to 'inactive' by default</li>
                    <li>• Use exact category names, subcategory names, and supplier codes</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2"
              >
                                 <Download className="h-4 w-4" />
                 Download Template
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || !selectedFile}
                >
                  {isImporting ? (
                    <>
                      <FileText className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Excel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Details Modal */}
      <Dialog open={showErrors} onOpenChange={setShowErrors}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="errors-description">
          <DialogHeader>
                       <DialogTitle className="flex items-center gap-2">
             <AlertCircle className="h-5 w-5 text-red-500" />
             Детали ошибок импорта
           </DialogTitle>
            <div id="errors-description" className="sr-only">
              Detailed list of import errors with explanations
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                             <p className="text-sm text-red-800 font-medium mb-2">
                 Найдено {importErrors.length} ошибок при импорте:
               </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {importErrors.map((error, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-white rounded border border-red-100">
                    <span className="text-red-500 font-mono text-xs mt-1">#{index + 1}</span>
                    <div className="text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                ))}
              </div>
            </div>

                         <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
               <h4 className="font-medium text-blue-900 mb-2">Как исправить эти ошибки:</h4>
               <ul className="text-sm text-blue-800 space-y-1">
                 <li>• <strong>Отсутствуют обязательные поля:</strong> Заполните все поля, отмеченные *</li>
                 <li>• <strong>Категория/Подкатегория не найдена:</strong> Используйте точные названия из справочного листа</li>
                 <li>• <strong>Код поставщика не найден:</strong> Используйте точные коды из справочного листа</li>
                 <li>• <strong>SKU уже существует:</strong> Используйте уникальный SKU для каждого продукта</li>
                 <li>• <strong>Ошибки базы данных:</strong> Проверьте формат данных и попробуйте снова</li>
               </ul>
             </div>

            <div className="flex justify-end gap-2">
                             <Button 
                 variant="outline" 
                 onClick={() => setShowErrors(false)}
               >
                 Закрыть
               </Button>
               <Button 
                 onClick={() => {
                   setShowErrors(false)
                   setImportErrors([])
                 }}
               >
                 Попробовать снова
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

