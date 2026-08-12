/* eslint-disable no-unused-vars, no-undef */
var ZoteroPulsPreferences = {
  prefix: "extensions.zotero.zoteropuls.ai.",
  defaults: {
    deepseek: {
      baseURL: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
    },
    openai: { baseURL: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
  },
  prompt:
    'Generate concise English academic tags for the paper below. Focus on research topic, method, and object. Avoid generic words, sentences, duplicates, and explanations. Return JSON only: {"tags":["tag"]}.',
  get(id) {
    return document.getElementById(`zotero-puls-ai-${id}`);
  },
  init() {
    const keys = {
      provider: "provider",
      "base-url": "baseURL",
      "api-key": "apiKey",
      model: "model",
      "tag-count": "tagCount",
      prompt: "prompt",
    };
    Object.entries(keys).forEach(([id, key]) => {
      this.get(id).value = Zotero.Prefs.get(`${this.prefix}${key}`, true) ?? "";
    });
    const provider = this.get("provider");
    if (!provider.value) provider.value = "deepseek";
    if (!this.get("base-url").value || !this.get("model").value)
      this.applyProviderDefaults();
    if (!this.get("tag-count").value) this.get("tag-count").value = 5;
    if (!this.get("prompt").value) this.get("prompt").value = this.prompt;
    provider.addEventListener("change", () => this.applyProviderDefaults());
  },
  applyProviderDefaults() {
    const preset = this.defaults[this.get("provider").value];
    if (!preset) return;
    this.get("base-url").value = preset.baseURL;
    this.get("model").value = preset.model;
  },
  save() {
    const values = {
      provider: this.get("provider").value,
      baseURL: this.get("base-url").value.trim().replace(/\/$/, ""),
      apiKey: this.get("api-key").value.trim(),
      model: this.get("model").value.trim(),
      tagCount: Math.max(
        1,
        Math.min(20, Number(this.get("tag-count").value) || 5),
      ),
      prompt: this.get("prompt").value.trim() || this.prompt,
    };
    Object.entries(values).forEach(([key, value]) =>
      Zotero.Prefs.set(`${this.prefix}${key}`, value, true),
    );
  },
};
