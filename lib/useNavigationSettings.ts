import useSWR from "swr"

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => r.json())

export type NavigationSettings = {
  mainMenu: Array<{ label: string; href: string }>
  showLanguageSwitcher: boolean
  showLoginButton: boolean
  showCartButton: boolean
}

export function useNavigationSettings() {
  const { data, isLoading, mutate } = useSWR("/api/site-settings/navigation", fetcher, { revalidateOnFocus: false })
  const settings: NavigationSettings = data?.data ?? {
    mainMenu: [],
    showLanguageSwitcher: true,
    showLoginButton: true,
    showCartButton: true,
  }
  return { settings, isLoading, mutate }
}

export async function saveNavigation(settings: NavigationSettings) {
  const res = await fetch("/api/site-settings/navigation", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  })
  if (!res.ok) throw new Error("Failed to save")
}
