import type { HttpClient } from "../../platform/zoteroServices";
import { zoteroHttpClient } from "../../platform/zoteroServices";
import type { EasyScholarResponse } from "./core";

let nextRequestAt = 0;

async function respectRateLimit(): Promise<void> {
  const scheduledAt = Math.max(Date.now(), nextRequestAt);
  nextRequestAt = scheduledAt + 500;
  const delay = scheduledAt - Date.now();
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function requestPublicationRank(
  secretKey: string,
  publicationName: string,
  http: HttpClient = zoteroHttpClient,
): Promise<EasyScholarResponse> {
  await respectRateLimit();
  const query = `secretKey=${encodeURIComponent(secretKey)}&publicationName=${encodeURIComponent(publicationName)}`;
  const response = await http.request<EasyScholarResponse>(
    "GET",
    `https://www.easyscholar.cc/open/getPublicationRank?${query}`,
    { responseType: "json", timeout: 30000 },
  );
  return response.response;
}
