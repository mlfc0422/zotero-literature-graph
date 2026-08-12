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

const DEFAULT_PROMPT = `Generate concise English academic tags for the paper below. Focus on research topic, method, and object. Avoid generic words, sentences, duplicates, and explanations. Return JSON only: {"tags":["tag"]}.`;

export function getAiTagSettings(): AiTagSettings {
  const get = (key: string, fallback: string) =>
    String(Zotero.Prefs.get(`${PREF_PREFIX}${key}`, true) ?? fallback);
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

function normalizeTags(values: unknown, maximum: number): string[] {
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
  const requestBody =
    settings.api === "responses"
      ? {
          model: settings.model,
          input: [
            { role: "developer", content: settings.prompt },
            {
              role: "user",
              content: `Generate exactly ${settings.tagCount} English tags.\n\nTitle: ${title}\n\nAbstract: ${abstract}`,
            },
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
        }
      : {
          model: settings.model,
          messages: [
            { role: "system", content: settings.prompt },
            {
              role: "user",
              content: `Generate exactly ${settings.tagCount} English tags.\n\nTitle: ${title}\n\nAbstract: ${abstract}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        };
  const response = await Zotero.HTTP.request(
    "POST",
    `${settings.baseURL}/${settings.api === "responses" ? "responses" : "chat/completions"}`,
    {
      body: JSON.stringify(requestBody),
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json",
      },
      responseType: "json",
      timeout: 60000,
    },
  );
  const body = response.response as {
    choices?: Array<{ message?: { content?: string } }>;
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const content =
    settings.api === "responses"
      ? (body.output_text ??
        body.output
          ?.flatMap((output) => output.content ?? [])
          .map((content) => content.text ?? "")
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
  const tags = normalizeTags(
    (parsed as { tags?: unknown }).tags,
    settings.tagCount,
  );
  if (!tags.length) throw new Error("模型没有返回有效英文标签");
  return tags;
}

export async function previewAiTags(
  sourceWin: Window,
  suggestedTags: string[],
): Promise<string[] | undefined> {
  return new Promise((resolve) => {
    const dialogData: Record<string, unknown> = {};
    const dialog = new ztoolkit.Dialog(1, 1)
      .addCell(0, 0, {
        tag: "div",
        namespace: "html",
        id: "zotero-puls-ai-preview",
      })
      .addButton("取消", "cancel")
      .addButton("应用标签", "apply")
      .setDialogData(dialogData);
    const collect = () => {
      const doc = dialog.window.document;
      const selected = [
        ...doc.querySelectorAll<HTMLInputElement>("input[data-ai-tag]:checked"),
      ].map((input) => input.value);
      const extra =
        (
          doc.getElementById("zotero-puls-ai-extra-tags") as HTMLInputElement
        )?.value.split(",") ?? [];
      return normalizeTags([...selected, ...extra], 20);
    };
    dialogData.loadCallback = () => {
      const doc = dialog.window.document;
      const host = doc.getElementById("zotero-puls-ai-preview")!;
      const heading = doc.createElement("p");
      heading.textContent =
        "勾选要写入的英文标签，也可在下方补充（逗号分隔）。";
      host.appendChild(heading);
      for (const tag of suggestedTags) {
        const label = doc.createElement("label");
        label.style.display = "block";
        const input = doc.createElement("input");
        input.type = "checkbox";
        input.checked = true;
        input.value = tag;
        input.setAttribute("data-ai-tag", "true");
        label.append(input, ` ${tag}`);
        host.appendChild(label);
      }
      const extra = doc.createElement("input");
      extra.id = "zotero-puls-ai-extra-tags";
      extra.placeholder = "Add tags, separated by commas";
      extra.style.width = "100%";
      host.appendChild(doc.createElement("br"));
      host.appendChild(extra);
    };
    dialogData.beforeUnloadCallback = () => {
      resolve(dialogData._lastButtonId === "apply" ? collect() : undefined);
    };
    dialog.open("AI 标签预览", {
      width: 480,
      height: 420,
      centerscreen: true,
      resizable: true,
      fitContent: false,
      noDialogMode: true,
    });
    sourceWin.focus();
  });
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
