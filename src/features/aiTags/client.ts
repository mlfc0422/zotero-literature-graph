import type { HttpClient } from "../../platform/zoteroServices";
import { zoteroHttpClient } from "../../platform/zoteroServices";
import {
  buildAiTagRequest,
  parseAiTagResponse,
  type AiTagRequestSettings,
  type AiTagResponse,
} from "./core";

export async function requestAiTags(
  settings: AiTagRequestSettings & { apiKey: string },
  title: string,
  abstract: string,
  http: HttpClient = zoteroHttpClient,
): Promise<string[]> {
  const request = buildAiTagRequest(settings, title, abstract);
  const response = await http.request<AiTagResponse>("POST", request.url, {
    body: JSON.stringify(request.body),
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    responseType: "json",
    timeout: 60000,
  });
  return parseAiTagResponse(response.response, settings.api, settings.tagCount);
}
