import { requestPublicationRank } from "../features/easyScholar/client";
import {
  EASY_SCHOLAR_FIELDS,
  formatEasyScholarLines,
  mergeEasyScholarBlock,
  type EasyScholarFieldKey,
} from "../features/easyScholar/core";
import { zoteroPreferenceStore } from "../platform/zoteroServices";

const PREF_PREFIX = "extensions.zotero.zoteropuls.easyscholar.";

export { EASY_SCHOLAR_FIELDS };

function getPref(key: string, fallback = ""): string {
  return String(zoteroPreferenceStore.get(`${PREF_PREFIX}${key}`, fallback));
}

export function getEasyScholarSelectedFields(): EasyScholarFieldKey[] {
  const defaults = EASY_SCHOLAR_FIELDS.map(([key]) => key);
  try {
    const keys = JSON.parse(getPref("fields", "[]")) as string[];
    const valid = new Set<EasyScholarFieldKey>(defaults);
    const selected = keys.filter((key): key is EasyScholarFieldKey =>
      valid.has(key as EasyScholarFieldKey),
    );
    return selected.length ? selected : defaults;
  } catch {
    return defaults;
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

  const response = await requestPublicationRank(secretKey, venue);
  if (response.code !== 200 || !response.data)
    throw new Error(response.msg || "EasyScholar 未返回该期刊或会议的信息");
  const lines = formatEasyScholarLines(response, selected);
  if (!lines.length) return false;
  const extra = String(item.getField("extra") || "");
  item.setField("extra", mergeEasyScholarBlock(extra, lines));
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
