import { useToast } from "@/hooks/use-toast"

export interface ApiError {
  error?: string
  details?: string
  message?: string
  code?: string
}

export function useErrorHandler() {
  const { toast } = useToast()

  const handleApiError = (error: any, defaultMessage = "An error occurred") => {
    // Логируем ошибку в человекочитаемом формате
    if (error && typeof error === 'object') {
      const errorInfo = {
        error: error.error || error.message || 'Unknown error',
        code: error.code || 'NO_CODE',
        details: error.details || 'No details'
      }
      console.error(`API Error: ${errorInfo.error} [${errorInfo.code}] — ${errorInfo.details}`)
    } else {
      console.error('API Error:', String(error))
    }
    
    let errorMessage = defaultMessage
    let errorTitle = "Error"
    
    // Если это пустой объект или null/undefined
    if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
      errorMessage = defaultMessage
      errorTitle = "Error"
    }
    // Если это объект с API ошибкой
    else if (error && typeof error === 'object') {
      if (error.error) errorTitle = error.error
      if (error.details) errorMessage = error.details
      else if (error.message) errorMessage = error.message
      
      // Специальная обработка для известных кодов ошибок
      if (error.code === 'HAS_RELATED_PRODUCTS') {
        errorTitle = "Cannot delete category"
        errorMessage = error.details || "This category has related products"
      } else if (error.code === 'HAS_SUBCATEGORIES') {
        errorTitle = "Cannot delete category"
        errorMessage = error.details || "This category has subcategories"
      } else if (error.code === 'FOREIGN_KEY_VIOLATION') {
        errorTitle = "Cannot delete"
        errorMessage = error.details || "This item is referenced by other records"
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    
    toast({
      title: errorTitle,
      description: errorMessage,
      variant: "destructive"
    })
  }

  const handleSuccess = (title: string, message?: string) => {
    toast({
      title,
      description: message,
      variant: "default"
    })
  }

  return {
    handleApiError,
    handleSuccess
  }
}
