export type FreeWebTranslationProvider =
  "cnki" | "huoshan-web" | "iciba" | "tencent-transmart";

export function baseLanguage(language: string): string {
  return language.toLowerCase().split("-")[0] || "auto";
}

export function sourceLanguageFor(targetLanguage: string): string {
  return baseLanguage(targetLanguage) === "zh" ? "en" : "auto";
}

export function requireTranslation(value: unknown, service: string): string {
  const translation = typeof value === "string" ? value.trim() : "";
  if (!translation) throw new Error(`${service} returned no translation`);
  return translation;
}

export function parseHuoshanResponse(body: any): string {
  return requireTranslation(body?.translation, "Huoshan Web");
}

export function parseTencentResponse(body: any): string {
  return requireTranslation(
    body?.auto_translation?.join("\n"),
    "Tencent Transmart",
  );
}
