import { NextResponse } from "next/server"
import { addMedia, listMedia } from "@/lib/cms"

export async function GET() {
  return NextResponse.json({ items: listMedia() })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const url = body?.url as string | undefined
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 })
  const item = addMedia({
    url,
    alt: body?.alt || "",
    width: body?.width,
    height: body?.height,
    size: body?.size,
  })
  return NextResponse.json(item)
}
