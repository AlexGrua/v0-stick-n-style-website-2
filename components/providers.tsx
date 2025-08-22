"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import AuthProvider from "@/components/auth/auth-provider"
import { I18nProvider } from "@/lib/i18n"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <I18nProvider>
          {children}
          <Toaster />
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
export default Providers
