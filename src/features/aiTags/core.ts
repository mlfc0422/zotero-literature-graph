export interface AiTagRequestSettings {
  api: "chat-completions" | "responses";
  baseURL: string;
  model: string;
  prompt: string;
  tagCount: number;
}

export interface AiTagResponse {
  choices?: Array<{ message?: { content?: string } }>;
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}

export function normalizeTags(values: unknown, maximum: number): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter((value) => {
      const key = value.toLocaleLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maximum);
}

export function buildAiTagRequest(
  settings: AiTagRequestSettings,
  title: string,
  abstract: string,
): { url: string; body: Record<string, unknown> } {
  const userContent = `Generate up to ${settings.tagCount} tags. Do not add filler tags just to reach this limit.\n\nPaper:\nTitle: ${title}\n\nAbstract: ${abstract}`;
  if (settings.api === "responses") {
    return {
      url: `${settings.baseURL}/responses`,
      body: {
        model: settings.model,
        input: [
          { role: "developer", content: settings.prompt },
          { role: "user", content: userContent },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "paper_tags",
            strict: true,
            schema: {
              type: "object",
              properties: {
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["tags"],
              additionalProperties: false,
            },
          },
        },
        store: false,
      },
    };
  }
  return {
    url: `${settings.baseURL}/chat/completions`,
    body: {
      model: settings.model,
      messages: [
        { role: "system", content: settings.prompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    },
  };
}

export function parseAiTagResponse(
  body: AiTagResponse,
  api: AiTagRequestSettings["api"],
  maximum: number,
): string[] {
  const content =
    api === "responses"
      ? (body.output_text ??
        body.output
          ?.flatMap((output) => output.content ?? [])
          .map((entry) => entry.text ?? "")
          .join(""))
      : body.choices?.[0]?.message?.content;
  if (!content) throw new Error("模型没有返回标签内容");
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    const json = content.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error("模型返回的标签格式无效");
    parsed = JSON.parse(json);
  }
  const tags = normalizeTags((parsed as { tags?: unknown }).tags, maximum);
  if (!tags.length) throw new Error("模型没有返回有效英文标签");
  return tags;
}
