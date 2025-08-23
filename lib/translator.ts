import type { LangCode } from "@/lib/i18n"

function langLabel(lang: string): string {
  if (lang === "cn") return "zh"
  if (lang === "ru") return "ru"
  if (lang === "es") return "es"
  if (lang === "en") return "en"
  if (lang.toLowerCase().startsWith("zh")) return "zh"
  return lang
}

async function tryOpenAI(texts: string[], target: LangCode, apiKey?: string): Promise<string[] | null> {
  if (!apiKey) return null
  const sys = `You are a professional translator. Translate user provided list of UI labels from English to ${langLabel(
    target,
  )}. Keep it concise; do not add punctuation or quotes. Return a pure JSON array of strings in the same order, no extra text.`
  const user = JSON.stringify(texts)
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: sys }, { role: "user", content: user }], temperature: 0.2 }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content || "[]"
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed.map((s: any) => String(s))
  } catch {}
  return null
}

async function tryDeepL(texts: string[], target: LangCode, apiKey?: string): Promise<string[] | null> {
  if (!apiKey) return null
  const targetLang = langLabel(target).toUpperCase().startsWith("ZH") ? "ZH" : langLabel(target).toUpperCase()
  const params = new URLSearchParams()
  texts.forEach((t) => params.append("text", t))
  params.append("target_lang", targetLang)
  params.append("source_lang", "EN")
  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `DeepL-Auth-Key ${apiKey}` },
    body: params.toString(),
  })
  if (!res.ok) return null
  const data = await res.json()
  const out = (data?.translations || []).map((t: any) => String(t?.text || ""))
  return out.length === texts.length ? out : null
}

async function tryMyMemory(texts: string[], target: LangCode): Promise<string[] | null> {
  const out: string[] = []
  const tgt = langLabel(target)
  for (const text of texts) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(
        tgt,
      )}`
      const res = await fetch(url)
      if (!res.ok) return null
      const data = await res.json()
      const translated = data?.responseData?.translatedText
      out.push(typeof translated === "string" && translated.length ? translated : text)
    } catch {
      return null
    }
  }
  return out
}

async function tryLibreTranslate(texts: string[], target: LangCode): Promise<string[] | null> {
  const out: string[] = []
  for (const text of texts) {
    try {
      const res = await fetch("https://libretranslate.com/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, source: "en", target: langLabel(target), format: "text" }),
      })
      if (!res.ok) return null
      const data = await res.json()
      out.push(String(data?.translatedText || text))
    } catch {
      return null
    }
  }
  return out
}

export async function translateBatch(texts: string[], target: LangCode): Promise<string[]> {
  const openaiKey = process.env.OPENAI_API_KEY
  const deeplKey = process.env.DEEPL_API_KEY

  const a = await tryOpenAI(texts, target, openaiKey)
  if (a) return a

  const b = await tryDeepL(texts, target, deeplKey)
  if (b) return b

  const c = await tryMyMemory(texts, target)
  if (c) return c

  const d = await tryLibreTranslate(texts, target)
  if (d) return d

  return texts
}
