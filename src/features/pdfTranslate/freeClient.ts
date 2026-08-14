import {
  aesEcbDecrypt,
  aesEcbEncrypt,
  base64Encode,
} from "../../platform/browserCrypto";
import {
  zoteroHttpClient,
  zoteroMd5,
  type HttpClient,
} from "../../platform/zoteroServices";
import {
  baseLanguage,
  parseHuoshanResponse,
  parseTencentResponse,
  requireTranslation,
  sourceLanguageFor,
  type FreeWebTranslationProvider,
} from "./freeCore";

let cnkiToken: { value: string; expires: number } | null = null;

export async function requestFreeWebTranslation(
  provider: FreeWebTranslationProvider,
  text: string,
  targetLanguage: string,
  http: HttpClient = zoteroHttpClient,
): Promise<string> {
  const source = sourceLanguageFor(targetLanguage);
  switch (provider) {
    case "cnki":
      return requestCnki(text, http);
    case "huoshan-web":
      return requestHuoshan(text, source, targetLanguage, http);
    case "iciba":
      return requestIciba(text, source, targetLanguage, http);
    case "tencent-transmart":
      return requestTencent(text, source, targetLanguage, http);
  }
}

async function requestHuoshan(
  text: string,
  source: string,
  target: string,
  http: HttpClient,
): Promise<string> {
  const response = await http.request<any>(
    "POST",
    "https://translate.volcengine.com/crx/translate/v1",
    {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_language: baseLanguage(source),
        target_language: baseLanguage(target),
        text,
      }),
      responseType: "json",
      timeout: 30000,
    },
  );
  return parseHuoshanResponse(response.response);
}

async function requestTencent(
  text: string,
  source: string,
  target: string,
  http: HttpClient,
): Promise<string> {
  const response = await http.request<any>(
    "POST",
    "https://transmart.qq.com/api/imt",
    {
      headers: {
        "Content-Type": "application/json",
        Referer: "https://transmart.qq.com/zh-CN/index",
      },
      body: JSON.stringify({
        header: {
          fn: "auto_translation",
          client_key: "browser-chrome-110.0.0-Mac OS-zotero-puls",
        },
        type: "plain",
        model_category: "normal",
        source: { lang: baseLanguage(source), text_list: [text] },
        target: { lang: baseLanguage(target) },
      }),
      responseType: "json",
      timeout: 30000,
    },
  );
  return parseTencentResponse(response.response);
}

async function requestCnki(text: string, http: HttpClient): Promise<string> {
  if (!cnkiToken || cnkiToken.expires <= Date.now()) {
    const token = await http.request<any>(
      "GET",
      "https://dict.cnki.net/fyzs-front-api/getToken",
      { responseType: "json", timeout: 30000 },
    );
    cnkiToken = {
      value: token.response?.data ?? token.response?.token ?? "",
      expires: Date.now() + 240000,
    };
  }
  const encrypted = base64Encode(
    await aesEcbEncrypt(text.slice(0, 800), "4e87183cfd3a45fe"),
  )
    .replace(/\//g, "_")
    .replace(/\+/g, "-");
  const response = await http.request<any>(
    "POST",
    "https://dict.cnki.net/fyzs-front-api/translate/literaltranslation",
    {
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Token: cnkiToken.value,
      },
      body: JSON.stringify({ words: encrypted, translateType: null }),
      responseType: "json",
      timeout: 30000,
    },
  );
  return requireTranslation(response.response?.data?.mResult, "CNKI");
}

async function requestIciba(
  text: string,
  source: string,
  target: string,
  http: HttpClient,
): Promise<string> {
  const query = text.slice(0, 3000);
  const seed = zoteroMd5(`6key_web_new_fanyi6dVjYLFyzfkFkk${query}`).slice(
    0,
    16,
  );
  const signKey = decodeIcibaKey(
    "%5C%C2%80%C2%9A%C2%A8%C2%B6%C2%B8y%C2%9B%C2%B2%C2%8F%7C%7F%C2%97%C3%88%C2%A9d",
  );
  const sign = base64Encode(await aesEcbEncrypt(seed, signKey));
  const response = await http.request<any>(
    "POST",
    `https://ifanyi.iciba.com/index.php?c=trans&m=fy&client=6&auth_user=key_web_new_fanyi&sign=${encodeURIComponent(sign)}`,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `from=${encodeURIComponent(baseLanguage(source))}&to=${encodeURIComponent(baseLanguage(target))}&q=${encodeURIComponent(query)}`,
      responseType: "json",
      timeout: 30000,
    },
  );
  if (typeof response.response?.content !== "string")
    throw new Error("iCIBA returned an invalid response");
  const decrypted = JSON.parse(
    await aesEcbDecrypt(response.response.content, "aahc3TfyfCEmER33"),
  );
  return requireTranslation(decrypted?.out, "iCIBA");
}

function decodeIcibaKey(value: string): string {
  const decoded = decodeURIComponent(value);
  const result = [String.fromCharCode(decoded.charCodeAt(0) - decoded.length)];
  for (let index = 1; index < decoded.length; index++)
    result.push(
      String.fromCharCode(
        decoded.charCodeAt(index) - result[index - 1].charCodeAt(0),
      ),
    );
  return result.join("");
}
