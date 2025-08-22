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
import { useState } from "react"
import { AuthDialog } from "@/components/auth/auth-dialog"

const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About us" },
  { href: "/catalog", label: "Catalog" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact Us" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <header className="w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="Stick'N'Style Home">
            <Puzzle className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold">Stick&apos;N&apos;Style</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {nav.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className={cn(
                  "text-sm text-muted-foreground hover:text-foreground transition-colors",
                  pathname === n.href && "text-foreground underline underline-offset-8",
                )}
              >
                {n.label}
              </Link>
            ))}
            <Button asChild className="ml-2 bg-orange-600 hover:bg-orange-700 text-white">
              <Link href="/create-n-order" aria-label="Create'N'Order">
                <Puzzle className="mr-2 h-4 w-4" />
                Create&apos;N&apos;Order
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account" className="h-16 w-16">
                    <span className="relative inline-flex">
                      <Image src="/icons/builder.png" alt="Account" width={32} height={32} priority />
                      {/* Online indicator dot (bottom-right) */}
                      <span
                        className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
                        aria-hidden="true"
                      ></span>
                      <span className="sr-only">Вы вошли в систему</span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => router.push("/account")}>Зайти в личный кабинет</DropdownMenuItem>
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

            <Button asChild variant="ghost" size="icon" aria-label="Cart" className="h-16 w-16">
              <Link href="/create-n-order">
                <Image src="/images/icons/cart-outline.svg" alt="Cart" width={32} height={32} priority />
              </Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden bg-transparent" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center gap-2">
                  <Puzzle className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold">Stick&apos;N&apos;Style</span>
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3">
                  {nav.map((n) => (
                    <Link key={n.label} href={n.href} className="text-sm">
                      {n.label}
                    </Link>
                  ))}
                </div>
                <Separator className="my-4" />
                <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                  <Link href="/create-n-order">
                    <Puzzle className="mr-2 h-4 w-4" />
                    Create&apos;N&apos;Order
                  </Link>
                </Button>
                <div className="mt-6">
                  <LanguageSwitcher mode="list" />
                </div>
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
