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
  easyScholarFields: [
    ["sci", "JCR 分区"],
    ["ssci", "SSCI 分区"],
    ["sciBase", "中科院基础版分区"],
    ["sciUp", "中科院升级版分区"],
    ["sciUpTop", "中科院升级版 Top 分区"],
    ["sciUpSmall", "中科院升级版小类分区"],
    ["sciif", "影响因子"],
    ["sciif5", "5 年影响因子"],
    ["sciwarn", "中科院预警"],
    ["eii", "EI"],
    ["cscd", "CSCD"],
    ["pku", "北大核心"],
    ["cssci", "南大核心"],
    ["zhongguokejihexin", "科技核心"],
    ["ccf", "CCF"],
    ["ajg", "AJG"],
    ["utd24", "UTD24"],
    ["ft50", "FT50"],
    ["fms", "FMS"],
    ["jci", "JCI"],
    ["ahci", "AHCI"],
    ["esi", "ESI"],
    ["xr", "人大复印资料"],
    ["xrTop", "人大复印资料 Top"],
    ["xrSmall", "人大复印资料小类"],
    ["xrWarn", "人大复印资料预警"],
    ["swufe", "西南财经大学分类"],
    ["cufe", "中央财经大学分类"],
    ["uibe", "对外经贸大学分类"],
    ["sdufe", "山东财经大学分类"],
    ["xdu", "西安电子科技大学分类"],
    ["swjtu", "西南交通大学分类"],
    ["ruc", "中国人民大学分类"],
    ["xmu", "厦门大学分类"],
    ["sjtu", "上海交通大学分类"],
    ["fdu", "复旦大学分类"],
    ["hhu", "河海大学分类"],
    ["scu", "四川大学分类"],
    ["cqu", "重庆大学分类"],
    ["nju", "南京大学分类"],
    ["xju", "新疆大学分类"],
    ["cug", "中国地质大学分类"],
    ["cju", "长江大学分类"],
    ["zju", "浙江大学分类"],
    ["cpu", "中国药科大学分类"],
    ["xr", "人大复印资料"],
    ["xrTop", "人大复印资料 Top"],
    ["xrSmall", "人大复印资料小类"],
    ["xrWarn", "人大复印资料预警"],
    ["swufe", "西南财经大学分类"],
    ["cufe", "中央财经大学分类"],
    ["uibe", "对外经贸大学分类"],
    ["sdufe", "山东财经大学分类"],
    ["xdu", "西安电子科技大学分类"],
    ["swjtu", "西南交通大学分类"],
    ["ruc", "中国人民大学分类"],
    ["xmu", "厦门大学分类"],
    ["sjtu", "上海交通大学分类"],
    ["fdu", "复旦大学分类"],
    ["hhu", "河海大学分类"],
    ["scu", "四川大学分类"],
    ["cqu", "重庆大学分类"],
    ["nju", "南京大学分类"],
    ["xju", "新疆大学分类"],
    ["cug", "中国地质大学分类"],
    ["cju", "长江大学分类"],
    ["zju", "浙江大学分类"],
    ["cpu", "中国药科大学分类"],
  ],
  prompt: `Generate concise academic topic tags for the paper below.

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
{"tags": ["tag1", "tag2", "tag3"]}`,
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
      Zotero.Prefs.set(`${this.prefix}provider`, provider.value, true);
      this.updatePackage();
    });
    this.get("api-key").addEventListener("input", () => this.persistApiKey());
    this.get("model").addEventListener("change", () => this.persistModel());
    this.get("tag-count").addEventListener("input", () =>
      this.persistTagCount(),
    );
    this.get("tag-count").addEventListener("change", () =>
      this.persistTagCount(),
    );
    this.get("prompt").addEventListener("input", () => this.persistPrompt());
    this.get("prompt").addEventListener("change", () => this.persistPrompt());
    this.get("fetch-models").addEventListener("click", () =>
      this.fetchOpenAIModels(),
    );
    this.initEasyScholar();
    this.updatePackage();
  },
  initEasyScholar() {
    const key = this.get("es-secret-key");
    const auto = this.get("es-auto-update");
    key.value =
      Zotero.Prefs.get(
        "extensions.zotero.zoteropuls.easyscholar.secretKey",
        true,
      ) || "";
    auto.checked =
      Zotero.Prefs.get(
        "extensions.zotero.zoteropuls.easyscholar.autoUpdate",
        true,
      ) !== false;
    key.addEventListener("input", () =>
      Zotero.Prefs.set(
        "extensions.zotero.zoteropuls.easyscholar.secretKey",
        key.value.trim(),
        true,
      ),
    );
    auto.addEventListener("change", () =>
      Zotero.Prefs.set(
        "extensions.zotero.zoteropuls.easyscholar.autoUpdate",
        auto.checked,
        true,
      ),
    );
    let selected;
    try {
      selected = JSON.parse(
        Zotero.Prefs.get(
          "extensions.zotero.zoteropuls.easyscholar.fields",
          true,
        ) || "[]",
      );
    } catch {
      selected = [];
    }
    if (!selected.length)
      selected = this.easyScholarFields.map(([field]) => field);
    const host = this.get("es-fields");
    host.replaceChildren();
    this.easyScholarFields.forEach(([field, label]) => {
      const row = document.createElement("label");
      row.style.display = "inline-block";
      row.style.marginRight = "12px";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = field;
      input.checked = selected.includes(field);
      input.addEventListener("change", () => this.persistEasyScholarFields());
      row.append(input, ` ${label}`);
      host.appendChild(row);
    });
  },
  persistEasyScholarFields() {
    const fields = [
      ...this.get("es-fields").querySelectorAll("input:checked"),
    ].map((input) => input.value);
    Zotero.Prefs.set(
      "extensions.zotero.zoteropuls.easyscholar.fields",
      JSON.stringify(fields),
      true,
    );
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
  persistTagCount() {
    const input = this.get("tag-count");
    const value = Math.max(1, Math.min(20, Number(input.value) || 5));
    input.value = value;
    Zotero.Prefs.set(`${this.prefix}tagCount`, value, true);
  },
  persistModel() {
    const provider = this.get("provider").value;
    const model = this.get("model").value;
    if (model) Zotero.Prefs.set(`${this.prefix}${provider}Model`, model, true);
  },
  persistPrompt() {
    Zotero.Prefs.set(
      `${this.prefix}prompt`,
      this.get("prompt").value.trim() || this.prompt,
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
};
window.ZoteroPulsPreferences = ZoteroPulsPreferences;
if (document.readyState === "loading")
  document.addEventListener(
    "DOMContentLoaded",
    () => ZoteroPulsPreferences.init(),
    { once: true },
  );
else window.setTimeout(() => ZoteroPulsPreferences.init(), 0);
