export interface ReadingStatus {
  read: boolean;
  readAt?: string;
}

const BLOCK_START = "[Puls Reading]";
const BLOCK_END = "[/Puls Reading]";
const BLOCK_PATTERN = /\n?\[Puls Reading\][\s\S]*?\[\/Puls Reading\]\n?/g;

export function extractReadingStatus(extra: string): ReadingStatus {
  const block = extra.match(
    /\[Puls Reading\]([\s\S]*?)\[\/Puls Reading\]/,
  )?.[1];
  if (!block || !/^\s*status:\s*read\s*$/m.test(block)) return { read: false };
  const readAt = /^\s*readAt:\s*(.+?)\s*$/m.exec(block)?.[1]?.trim();
  return readAt ? { read: true, readAt } : { read: true };
}

export function mergeReadingStatus(
  extra: string,
  status: ReadingStatus,
): string {
  const preserved = extra.replace(BLOCK_PATTERN, "").trim();
  if (!status.read) return preserved;
  const lines = [BLOCK_START, "status: read"];
  if (status.readAt) lines.push(`readAt: ${status.readAt}`);
  lines.push(BLOCK_END);
  return [preserved, lines.join("\n")].filter(Boolean).join("\n\n");
}

export function formatReadAt(value: string | undefined): string {
  if (!value) return "已读";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已读";
  return `已读 · ${date.toLocaleString("zh-CN", { hour12: false })}`;
}
