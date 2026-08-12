/* eslint-disable no-undef */
var ZoteroPulsPreferences = {
  prefix: "extensions.zotero.zoteropuls.ai.",
  packages: {
    deepseek: {
      key: "deepseekApiKey",
      description: "DeepSeek / Chat Completions API",
    },
    openai: {
      key: "openaiApiKey",
      description:
        "OpenAI / Responses API / API Key \u83b7\u53d6\u53ef\u7528\u6a21\u578b",
    },
  },
  deepseekModels: ["deepseek-v4-flash", "deepseek-v4-pro"],
  prompt:
    'Generate concise English academic tags for the paper below. Focus on research topic, method, and object. Avoid generic words, sentences, duplicates, and explanations. Return JSON only: {"tags":["tag"]}.',
  get(id) {
    return document.getElementById(`zotero-puls-ai-${id}`);
  },
  init() {
    const root = document.getElementById("zotero-puls-preferences");
    if (!root) return window.setTimeout(() => this.init(), 0);
    if (root.dataset.initialized === "true") return;
    root.dataset.initialized = "true";
    const provider = this.get("provider");
    const savedProvider =
      Zotero.Prefs.get(`${this.prefix}provider`, true) || "deepseek";
    const legacyModel =
      savedProvider === "deepseek-pro"
        ? "deepseek-v4-pro"
        : "deepseek-v4-flash";
    provider.value =
      savedProvider === "openai" || savedProvider === "openai-mini"
        ? "openai"
        : "deepseek";
    if (
      (savedProvider === "deepseek-flash" ||
        savedProvider === "deepseek-pro") &&
      !Zotero.Prefs.get(`${this.prefix}deepseekModel`, true)
    ) {
      Zotero.Prefs.set(`${this.prefix}deepseekModel`, legacyModel, true);
    }
    this.get("tag-count").value =
      Zotero.Prefs.get(`${this.prefix}tagCount`, true) || 5;
    this.get("prompt").value =
      Zotero.Prefs.get(`${this.prefix}prompt`, true) || this.prompt;
    root.dataset.provider = provider.value;
    provider.addEventListener("change", () => {
      this.persistApiKey(root.dataset.provider);
      this.updatePackage();
    });
    this.get("api-key").addEventListener("input", () => this.persistApiKey());
    this.get("fetch-models").addEventListener("click", () =>
      this.fetchOpenAIModels(),
    );
    this.get("save").addEventListener("click", () => this.save());
    this.updatePackage();
  },
  persistApiKey(provider) {
    const root = document.getElementById("zotero-puls-preferences");
    const activeProvider =
      provider || root.dataset.provider || this.get("provider").value;
    const preset = this.packages[activeProvider];
    if (preset)
      Zotero.Prefs.set(
        `${this.prefix}${preset.key}`,
        this.get("api-key").value.trim(),
        true,
      );
  },
  updatePackage() {
    const provider = this.get("provider").value;
    const preset = this.packages[provider];
    const isOpenAI = provider === "openai";
    this.get("package-description").textContent = preset.description;
    this.get("api-key").value =
      Zotero.Prefs.get(`${this.prefix}${preset.key}`, true) || "";
    document.getElementById("zotero-puls-preferences").dataset.provider =
      provider;
    this.get("fetch-models").hidden = !isOpenAI;
    if (isOpenAI) {
      this.setModelOptions(
        [],
        Zotero.Prefs.get(`${this.prefix}openaiModel`, true) || "",
      );
    } else {
      this.setModelOptions(
        this.deepseekModels,
        Zotero.Prefs.get(`${this.prefix}deepseekModel`, true) ||
          "deepseek-v4-flash",
      );
    }
  },
  setModelOptions(models, selected) {
    const select = this.get("model");
    select.replaceChildren();
    const values = models.length ? models : selected ? [selected] : [];
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = values.length
      ? "\u9009\u62e9\u6a21\u578b"
      : "\u586b\u5199 API Key \u540e\u83b7\u53d6\u6a21\u578b";
    select.appendChild(placeholder);
    values.forEach((model) => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      select.appendChild(option);
    });
    select.disabled = !values.length;
    select.value = selected || "";
  },
  async fetchOpenAIModels() {
    this.persistApiKey("openai");
    const key = this.get("api-key").value.trim();
    if (!key) return alert("\u8bf7\u5148\u586b\u5199 OpenAI API Key\u3002");
    const button = this.get("fetch-models");
    button.disabled = true;
    button.textContent = "\u6b63\u5728\u83b7\u53d6\u2026";
    try {
      const response = await Zotero.HTTP.request(
        "GET",
        "https://api.openai.com/v1/models",
        {
          headers: { Authorization: `Bearer ${key}` },
          responseType: "json",
          timeout: 30000,
        },
      );
      const models = (response.response.data || [])
        .map((model) => model.id)
        .filter((id) => /^(gpt|o[134])[-\w.]*$/i.test(id))
        .filter(
          (id) =>
            !/audio|realtime|transcribe|tts|image|search|codex|chat-latest/i.test(
              id,
            ),
        )
        .sort((left, right) => left.localeCompare(right));
      if (!models.length)
        throw new Error(
          "\u8be5 Key \u6ca1\u6709\u8fd4\u56de\u53ef\u7528\u4e8e\u6587\u672c\u751f\u6210\u7684\u6a21\u578b\u3002",
        );
      this.setModelOptions(
        models,
        Zotero.Prefs.get(`${this.prefix}openaiModel`, true) || models[0],
      );
    } catch (error) {
      alert(
        `\u83b7\u53d6 OpenAI \u6a21\u578b\u5931\u8d25\uff1a${error.message || error}`,
      );
    } finally {
      button.disabled = false;
      button.textContent = "\u83b7\u53d6\u53ef\u7528\u6a21\u578b";
    }
  },
  save() {
    const provider = this.get("provider").value;
    const model = this.get("model").value;
    if (!model)
      return alert("\u8bf7\u5148\u9009\u62e9\u4e00\u4e2a\u6a21\u578b\u3002");
    this.persistApiKey(provider);
    Zotero.Prefs.set(`${this.prefix}provider`, provider, true);
    Zotero.Prefs.set(`${this.prefix}${provider}Model`, model, true);
    Zotero.Prefs.set(
      `${this.prefix}tagCount`,
      Math.max(1, Math.min(20, Number(this.get("tag-count").value) || 5)),
      true,
    );
    Zotero.Prefs.set(
      `${this.prefix}prompt`,
      this.get("prompt").value.trim() || this.prompt,
      true,
    );
  },
};
window.ZoteroPulsPreferences = ZoteroPulsPreferences;
if (document.readyState === "loading")
  document.addEventListener(
    "DOMContentLoaded",
    () => ZoteroPulsPreferences.init(),
    { once: true },
  );
else window.setTimeout(() => ZoteroPulsPreferences.init(), 0);
