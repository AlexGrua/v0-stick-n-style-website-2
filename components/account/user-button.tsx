"use client"

import { useMemo, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/auth-provider"

// Worker/account icon button for the header.
// - Logged OUT: ghost button; click opens Auth Dialog (Login/Register/Forgot).
// - Logged IN: button turns bright green and shows a dropdown with:
//     • Зайти в личный кабинет
//     • Log out
export default function UserButton() {
  const router = useRouter()
  const { user, openAuth, logout } = useAuth()

  // Bright green when logged in; neutral when logged out
  const tintClass = useMemo(() => (user ? "bg-[#22c55e]" : "bg-foreground/90"), [user])

  const IconMask = (
    <span
      className={`inline-block ${tintClass}`}
      style={{
        WebkitMaskImage: "url(/icons/builder.png)",
        maskImage: "url(/icons/builder.png)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        width: 24,
        height: 24,
        display: "inline-block",
      }}
      aria-hidden="true"
    />
  )

  function stop(e: MouseEvent) {
    // Prevent any parent (e.g., language switcher container) from hijacking this click
    e.stopPropagation()
  }

  if (!user) {
    // Logged out — clicking opens the auth dialog
    return (
      <Button
        type="button"
        variant="ghost"
        className="h-10 w-10 p-0 rounded-xl hover:bg-muted/60"
        aria-label="Войти или зарегистрироваться"
        onClick={(e) => {
          stop(e)
          openAuth("login")
        }}
      >
        {IconMask}
      </Button>
    )
  }

  // Logged in — dropdown with Account and Logout
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-10 p-0 rounded-xl hover:bg-muted/60"
          aria-label="Меню пользователя"
          onClick={stop}
        >
          {IconMask}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuItem
          onClick={() => {
            router.push("/account")
          }}
        >
          Зайти в личный кабинет
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => {
            logout()
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
