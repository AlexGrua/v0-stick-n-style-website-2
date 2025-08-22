import { NextResponse } from "next/server"
import { getPublished, normalizeHome, setPublished } from "@/lib/home-content"

export async function GET() {
  // Return published snapshot (if any)
  const pub = getPublished()
  return NextResponse.json({ published: pub })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const normalized = normalizeHome(body)
    const saved = setPublished(normalized)
    return NextResponse.json({ published: saved })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid payload" }, { status: 400 })
  }
}
