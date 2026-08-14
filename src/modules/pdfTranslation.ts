import {
  requestGooglePdfTranslation,
  requestGoogleWebPdfTranslation,
  requestPdfTranslation,
} from "../features/pdfTranslate/client";
import { zoteroPreferenceStore } from "../platform/zoteroServices";
import { getAiTagSettings } from "./aiTagging";

const PREF_PREFIX = "extensions.zotero.zoteropuls.ai.";

export type PdfTranslationProvider = "ai" | "google-cloud" | "google-free";

const VALID_PROVIDERS = new Set<PdfTranslationProvider>([
  "ai",
  "google-cloud",
  "google-free",
]);

export function normalizePdfTranslationProvider(
  value: unknown,
  fallback: PdfTranslationProvider = "google-free",
): PdfTranslationProvider {
  return typeof value === "string" &&
    VALID_PROVIDERS.has(value as PdfTranslationProvider)
    ? (value as PdfTranslationProvider)
    : fallback;
}

export function getPdfTranslationProvider(): PdfTranslationProvider {
  return normalizePdfTranslationProvider(
    zoteroPreferenceStore.get(`${PREF_PREFIX}translateProvider`, "google-free"),
  );
}

export function getPdfTranslationFallback(): PdfTranslationProvider | null {
  const value = zoteroPreferenceStore.get(
    `${PREF_PREFIX}translateFallback`,
    "none",
  );
  return value === "none"
    ? null
    : normalizePdfTranslationProvider(value, "google-free");
}

export function getPdfTranslationTargetLanguage(): string {
  const value = String(
    zoteroPreferenceStore.get(`${PREF_PREFIX}translateTargetLanguage`, "zh-CN"),
  ).trim();
  return value || "zh-CN";
}

export async function translatePdfSelection(text: string): Promise<string> {
  const provider = getPdfTranslationProvider();
  const targetLanguage = getPdfTranslationTargetLanguage();
  try {
    return await translateWithProvider(provider, text, targetLanguage);
  } catch (primaryError) {
    const fallback = getPdfTranslationFallback();
    if (!fallback || fallback === provider) throw primaryError;
    return translateWithProvider(fallback, text, targetLanguage);
  }
}

async function translateWithProvider(
  provider: PdfTranslationProvider,
  text: string,
  targetLanguage: string,
): Promise<string> {
  if (provider === "google-free")
    return requestGoogleWebPdfTranslation(text, targetLanguage);

  if (provider === "google-cloud") {
    const apiKey = String(
      zoteroPreferenceStore.get(`${PREF_PREFIX}googleTranslateApiKey`, ""),
    ).trim();
    if (!apiKey)
      throw new Error("请先在 Zotero Puls 设置中填写 Google 翻译 API Key");
    return requestGooglePdfTranslation(apiKey, text, targetLanguage);
  }

  const settings = getAiTagSettings();
  if (!settings.apiKey)
    throw new Error("请先在 Zotero Puls 设置中填写 AI API Key");
  if (!settings.model) throw new Error("请先在 Zotero Puls 设置中选择 AI 模型");
  return requestPdfTranslation(settings, text, targetLanguage);
}
