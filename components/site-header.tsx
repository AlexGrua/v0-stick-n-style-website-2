"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Puzzle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CartEditPortal } from "@/components/cart/edit-portal"
import { LanguageSwitcher } from "@/components/lang/language-switcher"
import { useAuth } from "@/components/auth/auth-provider"
import { useState, useEffect } from "react"
import { AuthDialog } from "@/components/auth/auth-dialog"

interface NavigationItem {
  id: string
  label: string
  href: string
  visible: boolean
  order: number
  type: "link" | "button"
  icon?: string
  className?: string
}

interface NavigationSettings {
  mainMenu: NavigationItem[]
  showLanguageSwitcher: boolean
  showLoginButton: boolean
  showCartButton: boolean
  showCreateNOrder: boolean
}

const defaultNavigation: NavigationSettings = {
  mainMenu: [
    { id: "home", href: "/", label: "Home", visible: true, order: 1, type: "link" },
    { id: "about", href: "/about", label: "About us", visible: true, order: 2, type: "link" },
    { id: "catalog", href: "/catalog", label: "Catalog", visible: true, order: 3, type: "link" },
    { id: "faqs", href: "/faqs", label: "FAQs", visible: true, order: 4, type: "link" },
    { id: "contact", href: "/contact", label: "Contact Us", visible: true, order: 5, type: "link" },
  ],
  showLanguageSwitcher: true,
  showLoginButton: true,
  showCartButton: true,
  showCreateNOrder: true,
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [navigation, setNavigation] = useState<NavigationSettings>(defaultNavigation)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        console.log("[v0] Loading navigation settings...")

        const response = await fetch("/api/site-settings/navigation")
        console.log("[v0] Navigation API response status:", response.status)

        if (response.ok) {
          const result = await response.json()
          console.log("[v0] Navigation API result:", result)

          if (result.data) {
            const newNavigation = {
              ...defaultNavigation,
              ...result.data,
            }
            console.log("[v0] Setting navigation:", newNavigation)
            setNavigation(newNavigation)
          } else {
            console.log("[v0] No navigation data found, using defaults")
            setNavigation(defaultNavigation)
          }
        } else {
          console.error("[v0] Navigation API error:", response.status, response.statusText)
          setNavigation(defaultNavigation)
        }
      } catch (error) {
        console.error("[v0] Failed to load navigation settings:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNavigation()
  }, [])

  const visibleMenuItems = navigation.mainMenu.filter((item) => item.visible).sort((a, b) => a.order - b.order)

  if (loading) {
    return (
      <header className="w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="Stick'N'Style Home">
            <Image src="/sns-logo.png" alt="Stick'N'Style" width={100} height={26} priority />
          </Link>
          <div className="animate-pulse">Loading...</div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="Stick'N'Style Home">
            <Image src="/sns-logo.png" alt="Stick'N'Style" width={100} height={26} priority />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {visibleMenuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "text-sm text-muted-foreground hover:text-foreground transition-colors",
                  pathname === item.href && "text-foreground underline underline-offset-8 decoration-lime-500",
                  item.className,
                )}
              >
                {item.label}
              </Link>
            ))}
            {navigation.showCreateNOrder && (
              <Button asChild className="ml-2 bg-orange-600 hover:bg-orange-700 text-white">
                <Link href="/create-n-order" aria-label="Create'N'Order" className="flex items-center gap-2">
                  <Puzzle className="w-4 h-4 text-white" />
                  Create&apos;N&apos;Order
                </Link>
              </Button>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {navigation.showLanguageSwitcher && (
              <>
                {console.log("[v0] Showing Language Switcher:", navigation.showLanguageSwitcher)}
                <LanguageSwitcher />
              </>
            )}

            {navigation.showLoginButton && (
              <>
                {console.log("[v0] Showing Login Button:", navigation.showLoginButton)}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Account" className="h-16 w-16">
                        <span className="relative inline-flex">
                          <Image src="/icons/builder.png" alt="Account" width={32} height={32} priority />
                          <span
                            className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
                            aria-hidden="true"
                          ></span>
                          <span className="sr-only">Вы вошли в систему</span>
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => router.push("/account")}>
                        Зайти в личный кабинет
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => logout()}>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Login"
                    className="h-16 w-16"
                    onClick={() => setAuthOpen(true)}
                  >
                    <Image src="/icons/builder.png" alt="Login" width={32} height={32} priority />
                  </Button>
                )}
              </>
            )}

            {navigation.showCartButton && (
              <>
                {console.log("[v0] Showing Cart Button:", navigation.showCartButton)}
                <Button asChild variant="ghost" size="icon" aria-label="Cart" className="h-16 w-16">
                  <Link href="/create-n-order">
                    <Image src="/images/icons/cart-outline.svg" alt="Cart" width={32} height={32} priority />
                  </Link>
                </Button>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden bg-transparent" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center gap-2">
                  <Image src="/sns-logo.png" alt="Stick'N'Style" width={80} height={21} priority />
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3">
                  {visibleMenuItems.map((item) => (
                    <Link key={item.id} href={item.href} className="text-sm">
                      {item.label}
                    </Link>
                  ))}
                </div>
                <Separator className="my-4" />
                {navigation.showCreateNOrder && (
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                    <Link href="/create-n-order" className="flex items-center gap-2">
                      <Puzzle className="w-4 h-4 text-white" />
                      Create&apos;N&apos;Order
                    </Link>
                  </Button>
                )}
                {navigation.showLanguageSwitcher && (
                  <div className="mt-6">
                    <LanguageSwitcher mode="list" />
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <CartEditPortal />
      </header>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  )
}

export default SiteHeader
