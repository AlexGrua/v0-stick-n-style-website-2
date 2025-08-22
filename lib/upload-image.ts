export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      console.log("[v0] Image converted to base64")
      resolve(result)
    }

    reader.onerror = () => {
      console.error("[v0] Error reading file")
      reject(new Error("Failed to read image file"))
    }

    reader.readAsDataURL(file)
  })
}
