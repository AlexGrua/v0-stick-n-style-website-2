export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const origin = url.origin
    // Try to get all products; adjust 'limit' if your /api/products supports pagination
    const res = await fetch(`${origin}/api/products?limit=10000`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load products")
    const payload = await res.json()
    const items: any[] = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : []

    let total = 0
    let active = 0
    let inactive = 0
    let discontinued = 0

    for (const p of items) {
      total++
      // Support either string status or boolean flags
      const s = (p.status || "").toString().toLowerCase()
      if (s === "active") active++
      else if (s === "inactive") inactive++
      else if (s === "discontinued") discontinued++
      else if (typeof p.active === "boolean") {
        if (p.active) active++
        else inactive++
      } else {
        // Unknown -> treat as inactive
        inactive++
      }
    }

    return Response.json({ total, active, inactive, discontinued })
  } catch (e: any) {
    // On error, return zeros but don't break the dashboard
    return Response.json({ total: 0, active: 0, inactive: 0, discontinued: 0 })
  }
}
