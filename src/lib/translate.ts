const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

export async function translateToJa(text: string, sourceLang: string): Promise<string> {
  const src = sourceLang.split("-")[0]; // "en-US" → "en"
  if (!text.trim() || src === "ja") return text;

  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=${src}|ja`;
  try {
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json() as { responseStatus: number; responseData: { translatedText: string } };
    if (data.responseStatus === 200 && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch {
    // ネットワークエラーは無視して原文を返す
  }
  return text;
}
