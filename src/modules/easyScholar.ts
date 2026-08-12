const PREF_PREFIX = "extensions.zotero.zoteropuls.easyscholar.";
const BLOCK_START = "[EasyScholar]";
const BLOCK_END = "[/EasyScholar]";

export const EASY_SCHOLAR_FIELDS = [
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
] as const;

type EasyScholarFieldKey = (typeof EASY_SCHOLAR_FIELDS)[number][0];
type EasyScholarResponse = {
  data?: { officialRank?: { all?: Record<string, unknown> } };
  msg?: string;
};

function getPref(key: string, fallback = ""): string {
  return String(Zotero.Prefs.get(`${PREF_PREFIX}${key}`, true) ?? fallback);
}

export function getEasyScholarSelectedFields(): EasyScholarFieldKey[] {
  try {
    const keys = JSON.parse(getPref("fields", "[]")) as string[];
    const valid = new Set(EASY_SCHOLAR_FIELDS.map(([key]) => key));
    return keys.filter((key): key is EasyScholarFieldKey =>
      valid.has(key as EasyScholarFieldKey),
    );
  } catch {
    return [];
  }
}

function getVenue(item: Zotero.Item): string {
  return String(
    Zotero.ItemTypes.getName(item.itemTypeID) === "journalArticle"
      ? item.getField("publicationTitle")
      : item.getField("conferenceName"),
  ).trim();
}

export async function updateEasyScholarItem(
  item: Zotero.Item,
): Promise<boolean> {
  const secretKey = getPref("secretKey");
  if (!secretKey)
    throw new Error("请先在 Zotero Puls 设置中填写 EasyScholar Secret Key");
  if (!item.isRegularItem()) return false;
  const venue = getVenue(item);
  if (!venue) return false;
  const selected = getEasyScholarSelectedFields();
  if (!selected.length) throw new Error("请至少选择一个 EasyScholar 信息字段");

  const url = `https://easyscholar.cc/open/getPublicationRank?secretKey=${encodeURIComponent(secretKey)}&publicationName=${encodeURIComponent(venue)}`;
  const response = await Zotero.HTTP.request("GET", url, {
    responseType: "json",
    timeout: 30000,
  });
  const body = response.response as EasyScholarResponse;
  const rank = body.data?.officialRank?.all;
  if (!rank)
    throw new Error(body.msg || "EasyScholar 未返回该期刊或会议的信息");

  const lines = EASY_SCHOLAR_FIELDS.filter(([key]) => selected.includes(key))
    .map(([key, label]) => {
      const value = rank[key];
      return value === undefined || value === null || value === ""
        ? undefined
        : `${label}: ${Array.isArray(value) ? value.join("；") : String(value)}`;
    })
    .filter((line): line is string => Boolean(line));
  if (!lines.length) return false;
  const block = `${BLOCK_START}\n${lines.join("\n")}\n${BLOCK_END}`;
  const extra = String(item.getField("extra") || "").trim();
  const blockPattern = /\n?\[EasyScholar\][\s\S]*?\[\/EasyScholar\]\n?/g;
  const preserved = extra.replace(blockPattern, "").trim();
  item.setField("extra", preserved ? `${preserved}\n\n${block}` : block);
  await item.saveTx();
  return true;
}

export function isEasyScholarAutoUpdateEnabled(): boolean {
  return getPref("autoUpdate", "true") === "true";
}

export function isEasyScholarConfigured(): boolean {
  return (
    Boolean(getPref("secretKey")) && getEasyScholarSelectedFields().length > 0
  );
}
