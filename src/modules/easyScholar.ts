import { requestPublicationRank } from "../features/easyScholar/client";
import {
  EASY_SCHOLAR_FIELDS,
  buildVenueCandidates,
  formatEasyScholarLines,
  mergeEasyScholarBlock,
  type EasyScholarFieldKey,
  type VenueCandidate,
} from "../features/easyScholar/core";
import { zoteroPreferenceStore } from "../platform/zoteroServices";
import { findPublishedVersion, isArxivItem } from "./publicationResolver";

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

function safeGetField(item: Zotero.Item, field: string): string {
  try {
    return String(item.getField(field as never) || "").trim();
  } catch {
    return "";
  }
}

export function getEasyScholarVenueCandidates(
  item: Zotero.Item,
): VenueCandidate[] {
  const itemType = Zotero.ItemTypes.getName(item.itemTypeID);
  const journalFields = ["publicationTitle", "journalAbbreviation", "series"];
  const conferenceFields = [
    "conferenceName",
    "proceedingsTitle",
    "publicationTitle",
    "series",
  ];
  const fallbackFields = [
    "publicationTitle",
    "conferenceName",
    "proceedingsTitle",
    "journalAbbreviation",
    "series",
  ];
  const fields =
    itemType === "journalArticle"
      ? journalFields
      : itemType === "conferencePaper"
        ? conferenceFields
        : fallbackFields;
  return buildVenueCandidates(
    fields.map((source) => ({ source, value: safeGetField(item, source) })),
  );
}

export function getEasyScholarMetadataSignature(item: Zotero.Item): string {
  const candidates = getEasyScholarVenueCandidates(item).map(
    (candidate) => candidate.normalized,
  );
  return JSON.stringify({
    title: safeGetField(item, "title"),
    doi: safeGetField(item, "DOI"),
    url: safeGetField(item, "url"),
    archive: safeGetField(item, "archive"),
    archiveLocation: safeGetField(item, "archiveLocation"),
    candidates,
  });
}

export type EasyScholarUpdateResult =
  | {
      status: "success";
      matchedName: string;
      attemptedNames: string[];
      resolvedPublishedVersion?: boolean;
    }
  | { status: "missing-venue"; attemptedNames: [] }
  | { status: "not-found"; attemptedNames: string[] }
  | { status: "no-selected-data"; attemptedNames: string[] };

export async function updateEasyScholarItem(
  item: Zotero.Item,
): Promise<EasyScholarUpdateResult> {
  const secretKey = getPref("secretKey");
  if (!secretKey)
    throw new Error("请先在 Zotero Puls 设置中填写 EasyScholar Secret Key");
  if (!item.isRegularItem())
    return { status: "missing-venue", attemptedNames: [] };
  const candidates = getEasyScholarVenueCandidates(item);
  const arxiv = isArxivItem(item);
  if (!candidates.length && !arxiv)
    return { status: "missing-venue", attemptedNames: [] };
  const selected = getEasyScholarSelectedFields();
  if (!selected.length) throw new Error("请至少选择一个 EasyScholar 信息字段");

  const attemptedNames: string[] = [];
  let foundPublication = false;
  for (const candidate of candidates) {
    attemptedNames.push(candidate.value);
    const response = await requestPublicationRank(secretKey, candidate.value);
    if (response.code === 40002)
      throw new Error(response.msg || "EasyScholar Secret Key 错误");
    if (response.code !== 200) continue;
    if (!response.data) continue;
    foundPublication = true;
    const lines = formatEasyScholarLines(response, selected);
    if (!lines.length) continue;
    const extra = String(item.getField("extra") || "");
    item.setField("extra", mergeEasyScholarBlock(extra, lines));
    await item.saveTx();
    return { status: "success", matchedName: candidate.value, attemptedNames };
  }
  if (arxiv) {
    const published = await findPublishedVersion(item);
    const venue = published?.venue.trim();
    if (
      venue &&
      !attemptedNames.some(
        (name) => name.toLocaleLowerCase() === venue.toLocaleLowerCase(),
      )
    ) {
      attemptedNames.push(venue);
      const response = await requestPublicationRank(secretKey, venue);
      if (response.code === 40002)
        throw new Error(response.msg || "EasyScholar Secret Key 错误");
      if (response.code === 200 && response.data) {
        foundPublication = true;
        const lines = formatEasyScholarLines(response, selected);
        if (lines.length) {
          const extra = String(item.getField("extra") || "");
          item.setField("extra", mergeEasyScholarBlock(extra, lines));
          await item.saveTx();
          return {
            status: "success",
            matchedName: venue,
            attemptedNames,
            resolvedPublishedVersion: true,
          };
        }
      }
    }
  }
  return {
    status: foundPublication ? "no-selected-data" : "not-found",
    attemptedNames,
  };
}

export function isEasyScholarAutoUpdateEnabled(): boolean {
  return getPref("autoUpdate", "true") === "true";
}

export function isEasyScholarConfigured(): boolean {
  return (
    Boolean(getPref("secretKey")) && getEasyScholarSelectedFields().length > 0
  );
}
