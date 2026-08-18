import {
  extractReadingStatus,
  mergeReadingStatus,
  type ReadingStatus,
} from "../features/readingStatus/core";

export function getReadingStatus(item: Zotero.Item): ReadingStatus {
  const target = getReadingStatusItem(item);
  return extractReadingStatus(String(target?.getField("extra") || ""));
}

export async function setReadingStatus(
  item: Zotero.Item,
  read: boolean,
): Promise<ReadingStatus> {
  const target = getReadingStatusItem(item);
  if (!target) throw new Error("未找到可标记阅读状态的文献");
  const status: ReadingStatus = read
    ? { read: true, readAt: new Date().toISOString() }
    : { read: false };
  const extra = String(target.getField("extra") || "");
  target.setField("extra", mergeReadingStatus(extra, status));
  await target.saveTx();
  return status;
}

export function getReadingStatusItem(
  item: Zotero.Item,
): Zotero.Item | undefined {
  if (item.isRegularItem()) return item;
  if (item.isAttachment()) {
    const parentID = item.parentItemID;
    return (parentID && Zotero.Items.get(parentID)) || item.parentItem || item;
  }
  return undefined;
}
