import {
  zoteroHttpClient,
  type HttpClient,
} from "../../platform/zoteroServices";
import {
  buildGoogleWebTranslateRequest,
  parseGoogleWebTranslateResponse,
  type GoogleWebTranslateResponse,
} from "./core";

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
