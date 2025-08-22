import { type NextRequest, NextResponse } from "next/server"
import { db, seed } from "@/lib/db"
import type { Attribute } from "@/lib/types"

function validate(body: any) {
  const errs: string[] = []
  if (!body.name) errs.push("name is required")
  if (!body.code) errs.push("code is required")
  if (!["text", "number", "boolean", "select", "multiselect", "color"].includes(body.type)) errs.push("invalid type")
  if (!Array.isArray(body.categoryIds)) errs.push("categoryIds must be array")
  if ((body.type === "select" || body.type === "multiselect") && !Array.isArray(body.options)) {
    errs.push("options must be array for select types")
  }
  return errs
}

export async function GET() {
  seed()
  const { attributes } = db()
  return NextResponse.json({ items: attributes })
}

export async function POST(req: NextRequest) {
  seed()
  const state = db()
  const body = await req.json()
  const errs = validate(body)
  if (errs.length) return NextResponse.json({ error: errs.join(", ") }, { status: 400 })
  const now = new Date().toISOString()
  const attr: Attribute = {
    id: crypto.randomUUID(),
    name: body.name,
    code: body.code,
    type: body.type,
    required: !!body.required,
    public: !!body.public,
    unit: body.unit,
    min: body.min !== undefined ? Number(body.min) : undefined,
    max: body.max !== undefined ? Number(body.max) : undefined,
    step: body.step !== undefined ? Number(body.step) : undefined,
    options: Array.isArray(body.options) ? body.options : [],
    categoryIds: body.categoryIds || [],
    order: body.order !== undefined ? Number(body.order) : undefined,
    createdAt: now,
    updatedAt: now,
  }
  state.attributes.push(attr)
  return NextResponse.json(attr, { status: 201 })
}
