export interface ReadingStatus {
  read: boolean;
  readAt?: string;
  readingSeconds?: number;
}

const BLOCK_START = "[Puls Reading]";
const BLOCK_END = "[/Puls Reading]";
const BLOCK_PATTERN = /\n?\[Puls Reading\][\s\S]*?\[\/Puls Reading\]\n?/g;

export function extractReadingStatus(extra: string): ReadingStatus {
  const block = extra.match(
    /\[Puls Reading\]([\s\S]*?)\[\/Puls Reading\]/,
  )?.[1];
  if (!block) return { read: false, readingSeconds: 0 };
  const read = /^\s*status:\s*read\s*$/m.test(block);
  const readAt = /^\s*readAt:\s*(.+?)\s*$/m.exec(block)?.[1]?.trim();
  const readingSeconds = Math.max(
    0,
    Number(/^\s*readingSeconds:\s*(\d+)\s*$/m.exec(block)?.[1] || 0),
  );
  return readAt ? { read, readAt, readingSeconds } : { read, readingSeconds };
}

export function mergeReadingStatus(
  extra: string,
  status: ReadingStatus,
): string {
  const preserved = extra.replace(BLOCK_PATTERN, "").trim();
  if (!status.read && !status.readingSeconds) return preserved;
  const lines = [BLOCK_START];
  if (status.read) lines.push("status: read");
  if (status.read && status.readAt) lines.push(`readAt: ${status.readAt}`);
  if (status.readingSeconds)
    lines.push(`readingSeconds: ${Math.floor(status.readingSeconds)}`);
  lines.push(BLOCK_END);
  return [preserved, lines.join("\n")].filter(Boolean).join("\n\n");
}

export function formatReadAt(value: string | undefined): string {
  if (!value) return "已读";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已读";
  return `已读 · ${date.toLocaleString("zh-CN", { hour12: false })}`;
}

export function formatReadAtShort(value: string | undefined): string {
  if (!value) return "已读";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已读";
  const pad = (number: number) => String(number).padStart(2, "0");
  return `已读 · ${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function formatReadingDuration(seconds: number | undefined): string {
  const totalMinutes = Math.floor(Math.max(0, seconds || 0) / 60);
  if (!totalMinutes) return "";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} 分`;
  return minutes ? `${hours} 小时 ${minutes} 分` : `${hours} 小时`;
}
