import type { HttpClient } from "../../platform/zoteroServices";
import { zoteroHttpClient } from "../../platform/zoteroServices";
import {
  buildPdfTranslateRequest,
  buildGoogleTranslateRequest,
  buildGoogleWebTranslateRequest,
  parseGoogleTranslateResponse,
  parseGoogleWebTranslateResponse,
  type GoogleWebTranslateResponse,
  parsePdfTranslateResponse,
  type GoogleTranslateResponse,
  type PdfTranslateResponse,
  type PdfTranslateSettings,
} from "./core";

export async function requestPdfTranslation(
  settings: PdfTranslateSettings & { apiKey: string },
  text: string,
  targetLanguage = "zh-CN",
  http: HttpClient = zoteroHttpClient,
): Promise<string> {
  const request = buildPdfTranslateRequest(settings, text, targetLanguage);
  const response = await http.request<PdfTranslateResponse>(
    "POST",
    request.url,
    {
      body: JSON.stringify(request.body),
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json",
      },
      responseType: "json",
      timeout: 60000,
    },
  );
  return parsePdfTranslateResponse(response.response, settings.api);
}

export async function requestGooglePdfTranslation(
  apiKey: string,
  text: string,
  targetLanguage = "zh-CN",
  http: HttpClient = zoteroHttpClient,
): Promise<string> {
  const request = buildGoogleTranslateRequest(apiKey, text, targetLanguage);
  const response = await http.request<GoogleTranslateResponse>(
    "POST",
    request.url,
    {
      body: JSON.stringify(request.body),
      headers: { "Content-Type": "application/json" },
      responseType: "json",
      timeout: 60000,
    },
  );
  return parseGoogleTranslateResponse(response.response);
}

export async function requestGoogleWebPdfTranslation(
  text: string,
  targetLanguage = "zh-CN",
  http: HttpClient = zoteroHttpClient,
): Promise<string> {
  const response = await http.request<GoogleWebTranslateResponse>(
    "GET",
    buildGoogleWebTranslateRequest(text, targetLanguage),
    { responseType: "json", timeout: 30000 },
  );
  return parseGoogleWebTranslateResponse(response.response);
}
