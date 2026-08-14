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
    ["customRank", "自定义数据集等级"],
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
  easyScholarGroups: [
    {
      title: "\u5e38\u7528\u5206\u533a",
      description:
        "SCI\u3001SSCI \u4e0e\u4e2d\u79d1\u9662\u7b49\u5e38\u7528\u671f\u520a\u5206\u533a\u4fe1\u606f",
      fields: ["sci", "ssci", "sciBase", "sciUp", "sciUpTop", "sciUpSmall"],
    },
    {
      title: "\u6307\u6807\u4e0e\u9884\u8b66",
      description:
        "JCR \u5f71\u54cd\u56e0\u5b50\u3001JCI\u3001ESI \u53ca\u671f\u520a\u9884\u8b66\u4fe1\u606f",
      fields: [
        "sciif",
        "sciif5",
        "jci",
        "esi",
        "sciwarn",
        "xr",
        "xrTop",
        "xrSmall",
        "xrWarn",
      ],
    },
    {
      title: "\u56fd\u5185\u6838\u5fc3\u4e0e\u6536\u5f55",
      description:
        "\u56fd\u5185\u6838\u5fc3\u671f\u520a\u4e0e\u4e3b\u8981\u6570\u636e\u5e93\u6536\u5f55\u60c5\u51b5",
      fields: ["eii", "cscd", "pku", "cssci", "zhongguokejihexin", "ahci"],
    },
    {
      title: "\u56fd\u9645\u5b66\u672f\u6392\u540d",
      description:
        "\u8ba1\u7b97\u673a\u3001\u5546\u5b66\u4e0e\u7ba1\u7406\u5b66\u79d1\u5e38\u7528\u7684\u671f\u520a\u8bc4\u4ef7\u5217\u8868",
      fields: ["ccf", "ajg", "utd24", "ft50", "fms"],
    },
    {
      title: "\u9ad8\u6821\u4e0e\u673a\u6784\u699c\u5355",
      description:
        "\u5404\u9ad8\u6821\u6216\u673a\u6784\u81ea\u5b9a\u4e49\u7684\u671f\u520a\u6392\u540d\u4e0e\u5206\u7ea7",
      fields: [
        "swufe",
        "cufe",
        "uibe",
        "sdufe",
        "xdu",
        "swjtu",
        "ruc",
        "xmu",
        "sjtu",
        "fdu",
        "hhu",
        "scu",
        "cqu",
        "nju",
        "xju",
        "cug",
        "cju",
        "zju",
        "cpu",
      ],
    },
    {
      title: "\u81ea\u5b9a\u4e49\u6570\u636e\u96c6",
      description:
        "EasyScholar \u8d26\u6237\u4e2d\u914d\u7f6e\u7684\u81ea\u5b9a\u4e49\u671f\u520a\u7b49\u7ea7",
      fields: ["customRank"],
    },
  ],
  easyScholarDescriptions: {
    customRank:
      "EasyScholar \u8d26\u6237\u4e2d\u81ea\u5b9a\u4e49\u6570\u636e\u96c6\u7684\u671f\u520a\u7b49\u7ea7",
    sci: "JCR \u7684 SCI \u671f\u520a\u5206\u533a",
    ssci: "JCR \u7684 SSCI \u671f\u520a\u5206\u533a",
    sciBase: "\u4e2d\u79d1\u9662 SCI \u57fa\u7840\u7248\u5206\u533a",
    sciUp: "\u4e2d\u79d1\u9662 SCI \u5347\u7ea7\u7248\u5206\u533a",
    sciUpTop: "\u4e2d\u79d1\u9662\u5347\u7ea7\u7248 Top \u5206\u533a",
    sciUpSmall: "\u4e2d\u79d1\u9662\u5347\u7ea7\u7248\u5c0f\u7c7b\u5206\u533a",
    sciif: "JCR \u5f71\u54cd\u56e0\u5b50",
    sciif5: "JCR \u4e94\u5e74\u5f71\u54cd\u56e0\u5b50",
    sciwarn: "\u4e2d\u79d1\u9662\u671f\u520a\u9884\u8b66\u4fe1\u606f",
    jci: "JCR \u671f\u520a\u5f15\u6587\u6307\u6807",
    esi: "ESI \u5b66\u79d1\u5206\u7c7b",
    eii: "EI \u5de5\u7a0b\u7d22\u5f15\u6536\u5f55",
    cscd: "\u4e2d\u56fd\u79d1\u5b66\u5f15\u6587\u6570\u636e\u5e93",
    pku: "\u5317\u5927\u6838\u5fc3\u671f\u520a",
    cssci:
      "CSSCI\uff0c\u5357\u4eac\u5927\u5b66\u4e2d\u6587\u793e\u4f1a\u79d1\u5b66\u5f15\u6587\u7d22\u5f15",
    zhongguokejihexin: "\u4e2d\u56fd\u79d1\u6280\u6838\u5fc3\u671f\u520a",
    ahci: "Arts & Humanities Citation Index \u6536\u5f55",
    ccf: "\u4e2d\u56fd\u8ba1\u7b97\u673a\u5b66\u4f1a\u63a8\u8350\u5206\u7ea7",
    ajg: "ABS Academic Journal Guide",
    utd24:
      "UT Dallas Top 100 Business School Research Rankings \u671f\u520a\u5217\u8868",
    ft50: "Financial Times 50 \u671f\u520a\u5217\u8868",
    fms: "FMS \u7ba1\u7406\u79d1\u5b66\u9ad8\u8d28\u91cf\u671f\u520a\u5206\u7c7b",
  },
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
  getEasyScholar(id) {
    return document.getElementById(`zotero-puls-es-${id}`);
  },
  createHtml(tagName) {
    return document.createElementNS("http://www.w3.org/1999/xhtml", tagName);
  },
  init() {
    const root = document.getElementById("zotero-puls-preferences");
    const requiredControls = [
      "provider",
      "api-key",
      "model",
      "tag-count",
      "pdf-auto-translate",
      "translate-target-language",
      "translate-google-free-enabled",
      "translate-huoshan-web-enabled",
      "translate-tencent-transmart-enabled",
      "translate-cnki-enabled",
      "translate-iciba-enabled",
      "prompt",
      "fetch-models",
    ];
    if (
      !root ||
      requiredControls.some((id) => !this.get(id)) ||
      !this.getEasyScholar("secret-key") ||
      !this.getEasyScholar("auto-update") ||
      !this.getEasyScholar("fields")
    )
      return window.setTimeout(() => this.init(), 10);
    if (root.dataset.initialized === "true") return;
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
    this.get("pdf-auto-translate").checked =
      Zotero.Prefs.get(`${this.prefix}pdfAutoTranslate`, true) !== false;
    this.get("translate-target-language").value =
      this.normalizeTranslateTargetLanguage(
        Zotero.Prefs.get(`${this.prefix}translateTargetLanguage`, true),
      );
    this.initPdfTranslationServices();
    this.get("prompt").value =
      Zotero.Prefs.get(`${this.prefix}prompt`, true) || this.prompt;
    root.dataset.provider = provider.value;
    provider.addEventListener("change", () => {
      this.persistProvider();
      this.updatePackage();
    });
    ["input", "change", "blur"].forEach((event) =>
      this.get("api-key").addEventListener(event, () => this.persistApiKey()),
    );
    this.get("model").addEventListener("change", () => this.persistModel());
    this.get("tag-count").addEventListener("input", () =>
      this.persistTagCount(),
    );
    this.get("tag-count").addEventListener("change", () =>
      this.persistTagCount(),
    );
    this.get("tag-count").addEventListener("blur", () =>
      this.persistTagCount(),
    );
    this.get("pdf-auto-translate").addEventListener("change", () =>
      this.persistPdfAutoTranslate(),
    );
    this.get("translate-target-language").addEventListener("change", () =>
      this.persistTranslateTargetLanguage(),
    );
    this.get("prompt").addEventListener("input", () => this.persistPrompt());
    this.get("prompt").addEventListener("change", () => this.persistPrompt());
    this.get("prompt").addEventListener("blur", () => this.persistPrompt());
    this.get("fetch-models").addEventListener("click", () =>
      this.fetchOpenAIModels(),
    );
    this.updatePackage();
    this.initEasyScholar();
    root.dataset.initialized = "true";
  },
  initEasyScholar() {
    const key = this.getEasyScholar("secret-key");
    const auto = this.getEasyScholar("auto-update");
    const host = this.getEasyScholar("fields");
    if (!key || !auto || !host) return;
    key.value =
      Zotero.Prefs.get(
        "extensions.zotero.zoteropuls.easyscholar.secretKey",
        true,
      ) || "";
    auto.checked =
      String(
        Zotero.Prefs.get(
          "extensions.zotero.zoteropuls.easyscholar.autoUpdate",
          true,
        ),
      ) !== "false";
    const persistSecretKey = () => this.persistEasyScholarSecretKey();
    key.addEventListener("input", persistSecretKey);
    key.addEventListener("change", persistSecretKey);
    key.addEventListener("blur", persistSecretKey);
    auto.addEventListener("change", () => this.persistEasyScholarAutoUpdate());
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
    let tooltip = null;
    try {
      tooltip = this.getEasyScholarTooltip();
    } catch {
      // Tooltip failure must never prevent the field controls from rendering.
    }
    const labels = new Map(this.easyScholarFields);
    const groupedFields = new Set(
      this.easyScholarGroups.flatMap((group) => group.fields),
    );
    const groups = [...this.easyScholarGroups];
    const uncategorized = [...labels.keys()].filter(
      (field) => !groupedFields.has(field),
    );
    if (uncategorized.length)
      groups.push({
        title: "\u5176\u4ed6",
        description:
          "\u5176\u4ed6\u53ef\u7528\u7684\u671f\u520a\u4fe1\u606f\u5b57\u6bb5",
        fields: uncategorized,
      });

    host.replaceChildren();
    groups.forEach((group) => {
      const section = this.createHtml("section");
      section.className = "puls-rank-group";
      const heading = this.createHtml("div");
      heading.className = "puls-rank-heading";
      heading.textContent = group.title;
      const hint = this.createHtml("span");
      hint.className = "puls-rank-hint";
      hint.textContent = "\u24d8 \u8bf4\u660e";
      heading.append(" ", hint);
      this.bindEasyScholarTooltip(heading, group.description, tooltip);
      const fields = this.createHtml("div");
      fields.className = "puls-rank-fields";
      group.fields.forEach((field) => {
        const label = labels.get(field);
        if (!label) return;
        const row = this.createHtml("label");
        row.className = "puls-rank-field";
        const description =
          this.easyScholarDescriptions[field] ||
          `${label}\uff1a\u7531 EasyScholar \u8fd4\u56de\u7684\u671f\u520a\u5206\u7ea7\u6216\u6392\u540d\u4fe1\u606f`;
        this.bindEasyScholarTooltip(row, description, tooltip);
        const input = this.createHtml("input");
        input.type = "checkbox";
        input.value = field;
        input.checked = selected.includes(field);
        input.addEventListener("change", () => this.persistEasyScholarFields());
        const name = this.createHtml("span");
        name.textContent = label;
        row.append(input, " ", name);
        fields.appendChild(row);
      });
      section.append(heading, fields);
      host.appendChild(section);
    });
  },
  getEasyScholarTooltip() {
    let tooltip = document.getElementById("zotero-puls-es-tooltip");
    if (tooltip) return tooltip;
    tooltip = this.createHtml("div");
    tooltip.id = "zotero-puls-es-tooltip";
    tooltip.className = "puls-rank-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.hidden = true;
    const root = document.getElementById("zotero-puls-preferences");
    if (!root) throw new Error("Zotero Puls preferences root is unavailable");
    root.appendChild(tooltip);
    return tooltip;
  },
  bindEasyScholarTooltip(target, description, tooltip) {
    if (!tooltip) return;
    const show = (event) => {
      tooltip.textContent = description;
      tooltip.hidden = false;
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 14}px`;
    };
    const move = (event) => {
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 14}px`;
    };
    target.addEventListener("mouseenter", show);
    target.addEventListener("mousemove", move);
    target.addEventListener("mouseleave", () => {
      tooltip.hidden = true;
    });
  },
  persistEasyScholarFields() {
    const host = this.getEasyScholar("fields");
    if (!host) return;
    const fields = [...host.querySelectorAll("input:checked")].map(
      (input) => input.value,
    );
    Zotero.Prefs.set(
      "extensions.zotero.zoteropuls.easyscholar.fields",
      JSON.stringify(fields),
      true,
    );
  },
  persistEasyScholarSecretKey() {
    const key = this.getEasyScholar("secret-key");
    if (!key) return;
    Zotero.Prefs.set(
      "extensions.zotero.zoteropuls.easyscholar.secretKey",
      key.value.trim(),
      true,
    );
  },
  persistEasyScholarAutoUpdate() {
    const auto = this.getEasyScholar("auto-update");
    if (!auto) return;
    Zotero.Prefs.set(
      "extensions.zotero.zoteropuls.easyscholar.autoUpdate",
      auto.checked,
      true,
    );
  },
  normalizeProvider(provider) {
    return provider === "openai" ? "openai" : "deepseek";
  },
  persistProvider() {
    const provider = this.normalizeProvider(this.get("provider").value);
    this.get("provider").value = provider;
    Zotero.Prefs.set(`${this.prefix}provider`, provider, true);
    return provider;
  },
  persistApiKey(provider) {
    const activeProvider = this.normalizeProvider(
      provider || this.get("provider").value,
    );
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
  persistPdfAutoTranslate() {
    Zotero.Prefs.set(
      `${this.prefix}pdfAutoTranslate`,
      this.get("pdf-auto-translate").checked,
      true,
    );
  },
  pdfTranslationProviders: [
    "google-free",
    "huoshan-web",
    "tencent-transmart",
    "cnki",
    "iciba",
  ],
  initPdfTranslationServices() {
    this.pdfTranslationProviders.forEach((provider) => {
      const enabled = this.get(`translate-${provider}-enabled`);
      const settings = document.getElementById(
        `zotero-puls-ai-translate-${provider}-settings`,
      );
      const savedEnabled = Zotero.Prefs.get(
        `${this.prefix}translate.${provider}.enabled`,
        true,
      );
      enabled.checked =
        savedEnabled == null
          ? provider === "google-free"
          : savedEnabled === true;
      const apiKey = this.get(`translate-${provider}-api-key`);
      if (apiKey)
        apiKey.value =
          Zotero.Prefs.get(
            `${this.prefix}translate.${provider}.apiKey`,
            true,
          ) || "";
      const model = this.get(`translate-${provider}-model`);
      if (model)
        model.value =
          Zotero.Prefs.get(`${this.prefix}translate.${provider}.model`, true) ||
          (provider === "openai" ? "gpt-5-mini" : "deepseek-v4-flash");
      const updateVisibility = () => {
        if (!settings) return;
        settings.hidden = !enabled.checked;
      };
      enabled.addEventListener("change", () => {
        Zotero.Prefs.set(
          `${this.prefix}translate.${provider}.enabled`,
          enabled.checked,
          true,
        );
        updateVisibility();
      });
      [apiKey, model].filter(Boolean).forEach((input) => {
        ["input", "change", "blur"].forEach((event) =>
          input.addEventListener(event, () =>
            Zotero.Prefs.set(
              `${this.prefix}translate.${provider}.${
                input === apiKey ? "apiKey" : "model"
              }`,
              input.value.trim(),
              true,
            ),
          ),
        );
      });
      updateVisibility();
    });
  },
  normalizeTranslateTargetLanguage(value) {
    return ["zh-CN", "en", "ja"].includes(value) ? value : "zh-CN";
  },
  persistTranslateTargetLanguage() {
    const select = this.get("translate-target-language");
    const language = this.normalizeTranslateTargetLanguage(select.value);
    select.value = language;
    Zotero.Prefs.set(`${this.prefix}translateTargetLanguage`, language, true);
  },
  persistModel() {
    const provider = this.normalizeProvider(this.get("provider").value);
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
    const provider = this.persistProvider();
    const preset = this.packages[provider];
    const isOpenAI = provider === "openai";
    this.get("package-description").textContent = preset.description;
    this.get("api-key").value =
      Zotero.Prefs.get(`${this.prefix}${preset.key}`, true) || "";
    document.getElementById("zotero-puls-preferences").dataset.provider =
      provider;
    const fetchButton = this.get("fetch-models");
    fetchButton.hidden = !isOpenAI;
    fetchButton.style.display = isOpenAI ? "inline-block" : "none";
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
        .filter((id) => /^(gpt|o\d+)[-\w.]*$/i.test(id))
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
      this.persistModel();
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
