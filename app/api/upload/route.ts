import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/api/guard"

export async function POST(request: NextRequest) {
  try {
    const guard = requireRole(request, "admin")
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Convert file to base64 for Next.js compatibility
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = file.type || "image/jpeg"
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Generate unique filename for reference
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop() || "jpg"
    const uniqueFilename = `${timestamp}-${randomId}.${extension}`

    console.log("[v0] Image uploaded:", uniqueFilename)

    return NextResponse.json({
      filename: uniqueFilename,
      url: dataUrl,
      size: buffer.length,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
