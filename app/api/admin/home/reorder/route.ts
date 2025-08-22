import { NextResponse } from "next/server"
import { reorderBlocks } from "@/lib/home-cms"

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}))
  const order: string[] = Array.isArray(body?.order) ? body.order : []
  if (!order.length) return NextResponse.json({ error: "order is required" }, { status: 400 })
  const blocks = reorderBlocks(order)
  return NextResponse.json({ blocks })
}
