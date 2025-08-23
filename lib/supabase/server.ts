import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY

export function createClient() {
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error("Supabase not configured")
  }
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // ignore if called in Server Component
        }
      },
    },
  })
}

function createDummyTable() {
  return {
    select: async () => ({ data: null, error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    single: async () => ({ data: null, error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    upsert: async () => ({ error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    update: async () => ({ error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    insert: async () => ({ error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    eq: function () { return this },
    order: function () { return this },
  }
}

export const supabaseAdmin = supabaseUrl && supabaseService
  ? createServerClient(supabaseUrl, supabaseService, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // no-op
        },
      },
    })
  : ({
      from: (_: string) => createDummyTable(),
    } as any)
