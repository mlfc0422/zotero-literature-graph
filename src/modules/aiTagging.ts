import { requestAiTags } from "../features/aiTags/client";
export { previewAiTags } from "../features/aiTags/previewDialog";
import { zoteroPreferenceStore } from "../platform/zoteroServices";

const PREF_PREFIX = "extensions.zotero.zoteropuls.ai.";

export interface AiTagSettings {
  provider: "deepseek" | "openai";
  baseURL: string;
  apiKey: string;
  model: string;
  api: "chat-completions" | "responses";
  tagCount: number;
  prompt: string;
}

const DEFAULT_PROMPT = `Generate concise academic topic tags for the paper below.

The tags will be used to connect related papers in a knowledge graph. Tags should capture the paper's main research areas, research problems, and reusable methodological directions.

Rules:
* Each tag should contain 1–3 meaningful words only.
* Use normal spaces between words in multi-word tags.
* Do not use PascalCase, camelCase, underscores, or unnecessary hyphens.
* Avoid articles, prepositions, and other unnecessary function words.
* Prefer established academic concepts and commonly used research terminology.
* Include both broader research areas and more specific topics when relevant.
* Include reusable methodological directions when they are central to the paper.
* Established application-oriented research fields are allowed.
* Avoid overly specific application scenarios, dataset names, benchmark names, and experimental settings.
* Avoid paper-specific algorithm names, model names, and terminology that is not broadly reusable.
* Avoid overly generic tags that provide little information.
* Avoid multiple near-synonymous tags for the same concept.
* Use consistent terminology across papers: the same concept should preferably receive the same tag.
* Prefer tags that could reasonably be shared by multiple related papers.
* Order tags roughly from broader research area to more specific topic or methodological direction.

Output JSON only, with no explanation or additional text:
{"tags": ["tag1", "tag2", "tag3"]}`;

export function getAiTagSettings(): AiTagSettings {
  const get = (key: string, fallback: string) =>
    String(zoteroPreferenceStore.get(`${PREF_PREFIX}${key}`, fallback));
  const storedProvider = get("provider", "deepseek");
  const provider = (
    storedProvider === "openai" || storedProvider === "openai-mini"
      ? "openai"
      : "deepseek"
  ) as AiTagSettings["provider"];
  const preset = {
    deepseek: {
      baseURL: "https://api.deepseek.com",
      model: get(
        "deepseekModel",
        storedProvider === "deepseek-pro"
          ? "deepseek-v4-pro"
          : "deepseek-v4-flash",
      ),
      apiKey: "deepseekApiKey",
      api: "chat-completions" as const,
    },
    openai: {
      baseURL: "https://api.openai.com/v1",
      model: get("openaiModel", ""),
      apiKey: "openaiApiKey",
      api: "responses" as const,
    },
  }[provider] ?? {
    baseURL: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    apiKey: "deepseekApiKey",
    api: "chat-completions" as const,
  };
  return {
    provider,
    baseURL: preset.baseURL,
    apiKey: get(preset.apiKey, get("apiKey", "")),
    model: preset.model,
    api: preset.api,
    tagCount: Math.max(1, Math.min(20, Number(get("tagCount", "5")) || 5)),
    prompt: get("prompt", DEFAULT_PROMPT),
  };
}

export async function generateAiTags(item: Zotero.Item): Promise<string[]> {
  const settings = getAiTagSettings();
  if (!settings.apiKey)
    throw new Error("请先在 Zotero Puls 设置中填写 API Key");
  if (!settings.baseURL || !settings.model) {
    throw new Error("请先在 Zotero Puls 设置中获取并选择 OpenAI 模型");
  }
  const title = String(item.getField("title") || "").trim();
  const abstract = String(item.getField("abstractNote") || "").trim();
  if (!abstract) throw new Error("该论文没有 Abstract，无法生成标签");
  return requestAiTags(settings, title, abstract);
}

export async function replaceManualTags(
  item: Zotero.Item,
  tags: string[],
): Promise<void> {
  const automaticTags = item
    .getTags()
    .filter((tag) => tag.type === 1)
    .map((tag) => ({ tag: tag.tag, type: 1 }));
  item.setTags([...automaticTags, ...tags.map((tag) => ({ tag, type: 0 }))]);
  await item.saveTx();
}
