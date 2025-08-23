import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const hasSupabase = !!supabaseUrl && !!supabaseServiceKey

export function createClient() {
  if (!hasSupabase) {
    // Return a dummy client that behaves like supabase-js but never throws
    return {
      from: (_: string) => createDummyTable(),
      rpc: async () => ({ data: null, error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
      auth: {
        signInWithPassword: async () => ({ data: null, error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
      },
    } as any
  }
  return createSupabaseClient(supabaseUrl!, supabaseServiceKey!, {
    realtime: { enabled: false },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Provide a safe fallback so imports do not crash in local dev without env vars
function createDummyTable() {
  return {
    select: async () => ({ data: null, error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    single: async () => ({ data: null, error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    upsert: async () => ({ error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    insert: async () => ({ error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    update: async () => ({ error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    delete: async () => ({ error: { code: "NO_SUPABASE", message: "Supabase disabled" } }),
    eq: function () { return this },
    order: function () { return this },
    or: function () { return this },
  }
}

export const supabaseAdmin = hasSupabase
  ? createSupabaseClient(supabaseUrl!, supabaseServiceKey!, {
      realtime: { enabled: false },
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : ({
      from: (_: string) => createDummyTable(),
    } as any)
