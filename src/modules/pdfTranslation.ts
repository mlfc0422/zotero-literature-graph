import { requestGoogleWebPdfTranslation } from "../features/pdfTranslate/client";
import { requestFreeWebTranslation } from "../features/pdfTranslate/freeClient";
import type { FreeWebTranslationProvider } from "../features/pdfTranslate/freeCore";
import { zoteroPreferenceStore } from "../platform/zoteroServices";

const PREF_PREFIX = "extensions.zotero.zoteropuls.ai.";

export type PdfTranslationProvider = FreeWebTranslationProvider | "google-free";

export const PDF_TRANSLATION_PROVIDER_ORDER: PdfTranslationProvider[] = [
  "google-free",
  "huoshan-web",
  "tencent-transmart",
  "cnki",
  "iciba",
];

export function getEnabledPdfTranslationProviders(): PdfTranslationProvider[] {
  return PDF_TRANSLATION_PROVIDER_ORDER.filter(
    (provider) =>
      zoteroPreferenceStore.get(
        `${PREF_PREFIX}translate.${provider}.enabled`,
        provider === "google-free",
      ) === true,
  );
}

export function getPdfTranslationTargetLanguage(): string {
  const value = String(
    zoteroPreferenceStore.get(`${PREF_PREFIX}translateTargetLanguage`, "zh-CN"),
  ).trim();
  return value || "zh-CN";
}

export async function translatePdfSelection(text: string): Promise<string> {
  const targetLanguage = getPdfTranslationTargetLanguage();
  const providers = getEnabledPdfTranslationProviders();
  if (!providers.length)
    throw new Error("Please enable a PDF translation service");
  let lastError: unknown;
  for (const provider of providers) {
    try {
      if (provider === "google-free") {
        return await requestGoogleWebPdfTranslation(text, targetLanguage);
      }
      return await requestFreeWebTranslation(provider, text, targetLanguage);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("All enabled PDF translation services failed");
}
