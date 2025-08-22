import { NextResponse } from "next/server"
import { listHome, setDraftBlocks, updateMeta, publishDraft } from "@/lib/home-cms"

// GET: returns the page model (draft and published refs)
export async function GET() {
  const page = listHome()
  return NextResponse.json(page)
}

// PUT: update meta or bulk save blocks
export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}))
  if (Array.isArray(body?.blocks)) {
    const page = setDraftBlocks(body.blocks)
    return NextResponse.json(page)
  }
  if (body?.meta) {
    const page = updateMeta(body.meta)
    return NextResponse.json(page)
  }
  return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
}

// POST: { action: "publish" }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  if (body?.action === "publish") {
    const page = publishDraft()
    return NextResponse.json(page)
  }
  return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
}
