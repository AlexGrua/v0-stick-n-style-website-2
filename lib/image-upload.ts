export async function uploadImage(file: File | string): Promise<string> {
  try {
    let imageData: string

    if (typeof file === "string") {
      // Если уже data URL, используем как есть
      imageData = file
    } else {
      // Конвертируем File в data URL
      imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    // Отправляем на сервер для постоянного хранения
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageData,
        filename: typeof file === "string" ? "image" : file.name,
      }),
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    const result = await response.json()
    console.log("[v0] Image uploaded successfully:", result.filename)

    return result.url
  } catch (error) {
    console.error("[v0] Image upload error:", error)
    throw error
  }
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
