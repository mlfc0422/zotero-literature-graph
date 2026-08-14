export type GoogleWebTranslateResponse = Array<
  Array<[string | null | undefined, ...unknown[]]> | unknown
>;

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
