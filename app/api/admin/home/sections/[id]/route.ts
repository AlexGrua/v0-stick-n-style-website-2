import { NextResponse } from "next/server"
import { patchBlock } from "@/lib/home-cms"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  try {
    const updated = patchBlock(params.id, {
      data: body?.data,
      is_active: typeof body?.is_active === "boolean" ? body.is_active : undefined,
    } as any)
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 400 })
  }
}
