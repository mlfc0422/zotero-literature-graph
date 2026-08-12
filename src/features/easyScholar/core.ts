export const EASY_SCHOLAR_FIELDS = [
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
  ["xr", "新锐学术"],
  ["xrTop", "新锐学术 Top"],
  ["xrSmall", "新锐学术小类"],
  ["xrWarn", "新锐学术预警"],
  ["swufe", "西南财经大学分类"],
  ["cufe", "中央财经大学分类"],
  ["uibe", "对外经济贸易大学分类"],
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

export type EasyScholarFieldKey = (typeof EASY_SCHOLAR_FIELDS)[number][0];

export interface EasyScholarResponse {
  code?: number;
  data?: {
    officialRank?: { all?: Record<string, unknown> };
    customRank?: {
      rankInfo?: Array<{
        uuid?: string;
        abbName?: string;
        oneRankText?: string;
        twoRankText?: string;
        threeRankText?: string;
        fourRankText?: string;
        fiveRankText?: string;
      }>;
      rank?: string[];
    };
  };
  msg?: string;
}

export function formatCustomRanks(response: EasyScholarResponse): string[] {
  const custom = response.data?.customRank;
  if (!custom?.rank?.length || !custom.rankInfo?.length) return [];
  const dataSetByID = new Map(
    custom.rankInfo
      .filter((entry) => Boolean(entry.uuid))
      .map((entry) => [entry.uuid!, entry]),
  );
  const levelFields = [
    "oneRankText",
    "twoRankText",
    "threeRankText",
    "fourRankText",
    "fiveRankText",
  ] as const;
  return custom.rank.flatMap((encoded) => {
    const [uuid, levelText] = encoded.split("&&&");
    const dataSet = dataSetByID.get(uuid);
    const rank = dataSet?.[levelFields[Number(levelText) - 1]];
    return dataSet?.abbName && rank ? [`${dataSet.abbName} ${rank}`] : [];
  });
}

export function formatEasyScholarLines(
  response: EasyScholarResponse,
  selected: EasyScholarFieldKey[],
): string[] {
  const rank = response.data?.officialRank?.all ?? {};
  const lines = EASY_SCHOLAR_FIELDS.filter(
    ([key]) => key !== "customRank" && selected.includes(key),
  )
    .map(([key, label]) => {
      const value = rank[key];
      return value === undefined || value === null || value === ""
        ? undefined
        : `${label}: ${Array.isArray(value) ? value.join("、") : String(value)}`;
    })
    .filter((line): line is string => Boolean(line));
  if (selected.includes("customRank")) {
    const custom = formatCustomRanks(response);
    if (custom.length) lines.push(`自定义数据集: ${custom.join("、")}`);
  }
  return lines;
}

export function mergeEasyScholarBlock(extra: string, lines: string[]): string {
  const block = `[EasyScholar]\n${lines.join("\n")}\n[/EasyScholar]`;
  const preserved = extra
    .trim()
    .replace(/\n?\[EasyScholar\][\s\S]*?\[\/EasyScholar\]\n?/g, "")
    .trim();
  return preserved ? `${preserved}\n\n${block}` : block;
}

export function extractEasyScholarSummary(extra: string): string {
  const block = extra.match(
    /\[EasyScholar\]\s*([\s\S]*?)\s*\[\/EasyScholar\]/i,
  );
  if (!block) return "";
  return block[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" | ");
}
