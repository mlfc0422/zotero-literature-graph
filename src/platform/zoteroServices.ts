export interface JsonHttpOptions {
  body?: string;
  headers?: Record<string, string>;
  responseType: "json" | "text";
  timeout: number;
}

export interface HttpClient {
  request<T>(
    method: "GET" | "POST",
    url: string,
    options: JsonHttpOptions,
  ): Promise<{ response: T }>;
}

export interface PreferenceStore {
  get(key: string, fallback?: unknown): unknown;
  set(key: string, value: string | number | boolean): void;
}

export const zoteroHttpClient: HttpClient = {
  async request<T>(
    method: "GET" | "POST",
    url: string,
    options: JsonHttpOptions,
  ) {
    const response = await Zotero.HTTP.request(method, url, options);
    return { response: response.response as T };
  },
};

export const zoteroPreferenceStore: PreferenceStore = {
  get(key, fallback) {
    return Zotero.Prefs.get(key, true) ?? fallback;
  },
  set(key, value) {
    Zotero.Prefs.set(key, value, true);
  },
};

export function zoteroMd5(value: string): string {
  return Zotero.Utilities.Internal.md5(value, false);
}
