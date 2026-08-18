export interface PluginErrorContext {
  feature: string;
  operation: string;
  userMessage: string;
  window?: Window;
  notify?: boolean;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface PluginErrorRecord {
  id: string;
  feature: string;
  operation: string;
  userMessage: string;
  message: string;
  stack?: string;
  metadata?: PluginErrorContext["metadata"];
  timestamp: string;
}

const recentErrors: PluginErrorRecord[] = [];
let errorSequence = 0;

export function normalizeError(error: unknown): {
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return { message: error.message || error.name, stack: error.stack };
  }
  if (error && typeof error === "object" && "message" in error) {
    const candidate = error as { message?: unknown; stack?: unknown };
    return {
      message: String(candidate.message || "未知错误"),
      stack: typeof candidate.stack === "string" ? candidate.stack : undefined,
    };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) || "未知错误" };
  } catch {
    return { message: String(error) || "未知错误" };
  }
}

export function reportPluginError(
  error: unknown,
  context: PluginErrorContext,
): PluginErrorRecord {
  const normalized = normalizeError(error);
  const timestamp = new Date().toISOString();
  const id = createErrorID(timestamp);
  const record: PluginErrorRecord = {
    id,
    feature: context.feature,
    operation: context.operation,
    userMessage: context.userMessage,
    message: normalized.message,
    stack: normalized.stack,
    metadata: context.metadata,
    timestamp,
  };
  recentErrors.push(record);
  if (recentErrors.length > 50) recentErrors.shift();

  const logMessage = formatErrorLog(record);
  try {
    Zotero.debug(logMessage);
    Zotero.logError(new Error(logMessage));
  } catch {
    // Error reporting must never mask the original failure.
  }

  if (context.notify !== false) {
    const win = context.window ?? Zotero.getMainWindow();
    try {
      win?.alert(formatErrorForUser(record));
    } catch {
      // A closing window may reject UI calls; the Zotero log still has details.
    }
  }
  return record;
}

export function formatErrorForUser(record: PluginErrorRecord): string {
  return [
    record.userMessage,
    "",
    `错误编号：${record.id}`,
    `位置：${record.feature} / ${record.operation}`,
    `详情：${record.message}`,
    "",
    "该错误已写入 Zotero 调试日志。",
  ].join("\n");
}

export function formatErrorLog(record: PluginErrorRecord): string {
  const metadata = record.metadata
    ? `\nmetadata=${JSON.stringify(record.metadata)}`
    : "";
  const stack = record.stack ? `\n${record.stack}` : "";
  return `[Zotero Puls][${record.id}] ${record.feature}/${record.operation}: ${record.message}${metadata}${stack}`;
}

export function getRecentPluginErrors(): readonly PluginErrorRecord[] {
  return recentErrors.slice();
}

function createErrorID(timestamp: string): string {
  errorSequence = (errorSequence + 1) % 1000;
  const compact = timestamp.replace(/\D/g, "").slice(0, 14);
  return `PULS-${compact}-${String(errorSequence).padStart(3, "0")}`;
}
