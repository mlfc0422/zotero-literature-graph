export interface PdfTranslateSettings {
  api: "chat-completions" | "responses";
  baseURL: string;
  model: string;
}

export interface PdfTranslateResponse {
  choices?: Array<{ message?: { content?: string } }>;
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}

export interface GoogleTranslateResponse {
  data?: { translations?: Array<{ translatedText?: string }> };
}

export type GoogleWebTranslateResponse = Array<
  Array<[string | null | undefined, ...unknown[]]> | unknown
>;

export function buildPdfTranslateRequest(
  settings: PdfTranslateSettings,
  text: string,
  targetLanguage = "zh-CN",
): { url: string; body: Record<string, unknown> } {
  const prompt = `Translate the selected academic text into fluent ${targetLanguage}. Return only the translation, without explanations, labels, or quotation marks.`;
  if (settings.api === "responses") {
    return {
      url: `${settings.baseURL}/responses`,
      body: {
        model: settings.model,
        input: [
          { role: "developer", content: prompt },
          { role: "user", content: text },
        ],
        store: false,
      },
    };
  }
  return {
    url: `${settings.baseURL}/chat/completions`,
    body: {
      model: settings.model,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    },
  };
}

export function parsePdfTranslateResponse(
  body: PdfTranslateResponse,
  api: PdfTranslateSettings["api"],
): string {
  const text =
    api === "responses"
      ? (body.output_text ??
        body.output
          ?.flatMap((output) => output.content ?? [])
          .map((entry) => entry.text ?? "")
          .join(""))
      : body.choices?.[0]?.message?.content;
  const translation = text?.trim();
  if (!translation) throw new Error("翻译服务没有返回内容");
  return translation;
}

export function buildGoogleTranslateRequest(
  apiKey: string,
  text: string,
  targetLanguage = "zh-CN",
): { url: string; body: Record<string, unknown> } {
  return {
    url: `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    body: { q: text, target: targetLanguage, format: "text" },
  };
}

export function buildGoogleWebTranslateRequest(
  text: string,
  targetLanguage = "zh-CN",
): string {
  return (
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=auto&tl=${encodeURIComponent(targetLanguage)}` +
    `&dt=t&q=${encodeURIComponent(text)}`
  );
}

export function parseGoogleTranslateResponse(
  body: GoogleTranslateResponse,
): string {
  const translation = body.data?.translations?.[0]?.translatedText?.trim();
  if (!translation) throw new Error("Google 翻译服务没有返回内容");
  return translation;
}

export function parseGoogleWebTranslateResponse(
  body: GoogleWebTranslateResponse,
): string {
  const segments = body[0];
  if (!Array.isArray(segments))
    throw new Error("Google web translation returned no content");
  const translation = segments
    .filter(Array.isArray)
    .map((segment) => segment[0])
    .filter((segment): segment is string => typeof segment === "string")
    .join("")
    .trim();
  if (!translation)
    throw new Error("Google web translation returned no content");
  return translation;
}
