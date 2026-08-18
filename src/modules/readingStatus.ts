import {
  extractReadingStatus,
  mergeReadingStatus,
  type ReadingStatus,
} from "../features/readingStatus/core";

const pendingWrites = new Map<number, Promise<ReadingStatus>>();

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
  return updateReadingStatus(target, (current) =>
    read
      ? { ...current, read: true, readAt: new Date().toISOString() }
      : { ...current, read: false, readAt: undefined },
  );
}

export async function addReadingSeconds(
  item: Zotero.Item,
  seconds: number,
): Promise<ReadingStatus> {
  const target = getReadingStatusItem(item);
  if (!target) throw new Error("未找到可累计阅读时长的文献");
  const increment = Math.max(0, Math.floor(seconds));
  if (!increment) return getReadingStatus(target);
  return updateReadingStatus(target, (current) => ({
    ...current,
    readingSeconds: (current.readingSeconds || 0) + increment,
  }));
}

function updateReadingStatus(
  target: Zotero.Item,
  update: (current: ReadingStatus) => ReadingStatus,
): Promise<ReadingStatus> {
  const previous =
    pendingWrites.get(target.id) || Promise.resolve(getReadingStatus(target));
  const write = previous
    .catch(() => getReadingStatus(target))
    .then(async () => {
      const current = getReadingStatus(target);
      const next = update(current);
      target.setField(
        "extra",
        mergeReadingStatus(String(target.getField("extra") || ""), next),
      );
      await target.saveTx();
      return next;
    });
  pendingWrites.set(target.id, write);
  void write.finally(() => {
    if (pendingWrites.get(target.id) === write) pendingWrites.delete(target.id);
  });
  return write;
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
