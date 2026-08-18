import {
  getEasyScholarMetadataSignature,
  isEasyScholarAutoUpdateEnabled,
  isEasyScholarConfigured,
  updateEasyScholarItem,
} from "../../modules/easyScholar";
import { reportPluginError } from "../../platform/errorReporter";
import {
  classifyEasyScholarValue,
  extractEasyScholarSummary,
  type EasyScholarRankTier,
} from "./core";

const EASY_SCHOLAR_MENU_ID = "zotero-puls-easyscholar-menuitem";
let notifierID: string | undefined;
let columnDataKey: string | undefined;
const pendingAutoUpdates = new Map<
  number,
  { timer: ReturnType<typeof setTimeout>; expiresAt: number; signature: string }
>();
const AUTO_UPDATE_QUIET_MS = 3000;
const AUTO_UPDATE_RETRY_MS = 8000;
const AUTO_UPDATE_WATCH_MS = 60000;

export function registerEasyScholarColumn(): void {
  if (columnDataKey) return;
  const registered = Zotero.ItemTreeManager.registerColumn({
    dataKey: "easyscholar-rank",
    label: "EasyScholar 分区",
    pluginID: addon.data.config.addonID,
    enabledTreeIDs: ["main"],
    width: "220",
    minWidth: 90,
    showInColumnPicker: true,
    dataProvider: (item) =>
      item.isRegularItem()
        ? extractEasyScholarSummary(String(item.getField("extra") || ""))
        : "",
    renderCell: (_index, data, column, _isFirstColumn, doc) =>
      renderRankCell(data, column.className, doc),
    zoteroPersist: ["width", "hidden", "sortDirection"],
  });
  if (registered) columnDataKey = registered;
}

const RANK_COLORS: Record<
  EasyScholarRankTier,
  { foreground: string; background: string; border: string }
> = {
  0: { foreground: "#475467", background: "#f2f4f7", border: "#d0d5dd" },
  1: { foreground: "#b42318", background: "#fef3f2", border: "#fecdca" },
  2: { foreground: "#6938a7", background: "#f9f5ff", border: "#e9d7fe" },
  3: { foreground: "#175cd3", background: "#eff8ff", border: "#b2ddff" },
  4: { foreground: "#067647", background: "#ecfdf3", border: "#abefc6" },
};

function renderRankCell(
  data: string,
  className: string,
  doc: Document,
): HTMLElement {
  const cell = doc.createElement("span");
  cell.className = `cell ${className}`;
  cell.style.display = "flex";
  cell.style.alignItems = "center";
  cell.style.gap = "4px";
  cell.style.overflow = "hidden";
  cell.title = data;
  for (const value of data.split(" | ").filter(Boolean)) {
    const colors = RANK_COLORS[classifyEasyScholarValue(value)];
    const badge = doc.createElement("span");
    badge.textContent = value;
    badge.style.cssText = `display:inline-block;flex:0 0 auto;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:1px 6px;border-radius:999px;font-size:0.92em;font-weight:600;color:${colors.foreground};background:${colors.background};border:1px solid ${colors.border}`;
    cell.appendChild(badge);
  }
  return cell;
}

export function registerEasyScholarFeature(win: _ZoteroTypes.MainWindow): void {
  registerMenu(win);
}

export function registerEasyScholarNotifier(): void {
  if (notifierID) return;
  notifierID = Zotero.Notifier.registerObserver(
    {
      notify: (event, type, ids) => {
        if (
          (event !== "add" && event !== "modify") ||
          type !== "item" ||
          !isEasyScholarAutoUpdateEnabled() ||
          !isEasyScholarConfigured()
        )
          return;
        for (const item of Zotero.Items.get(ids as number[])) {
          if (!item.isRegularItem()) continue;
          const existing = pendingAutoUpdates.get(item.id);
          if (event === "modify" && !existing) continue;
          const signature = getEasyScholarMetadataSignature(item);
          if (event === "modify" && existing?.signature === signature) continue;
          scheduleAutomaticUpdate(
            item.id,
            signature,
            existing?.expiresAt ?? Date.now() + AUTO_UPDATE_WATCH_MS,
            AUTO_UPDATE_QUIET_MS,
          );
        }
      },
    },
    ["item"],
    "zotero-puls-easyscholar",
  );
}

function scheduleAutomaticUpdate(
  itemID: number,
  signature: string,
  expiresAt: number,
  delay: number,
): void {
  const existing = pendingAutoUpdates.get(itemID);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(
    () => void runAutomaticUpdate(itemID, expiresAt),
    delay,
  );
  pendingAutoUpdates.set(itemID, { timer, expiresAt, signature });
}

async function runAutomaticUpdate(
  itemID: number,
  expiresAt: number,
): Promise<void> {
  if (!isEasyScholarAutoUpdateEnabled() || !isEasyScholarConfigured()) {
    pendingAutoUpdates.delete(itemID);
    return;
  }
  const item = Zotero.Items.get(itemID);
  if (!item || !item.isRegularItem()) {
    pendingAutoUpdates.delete(itemID);
    return;
  }
  const signature = getEasyScholarMetadataSignature(item);
  try {
    const result = await updateEasyScholarItem(item);
    if (result.status === "success") {
      Zotero.ItemTreeManager.refreshColumns();
      watchForMetadataChanges(itemID, signature, expiresAt);
      return;
    }
    if (result.status === "missing-venue" && Date.now() < expiresAt) {
      scheduleAutomaticUpdate(
        itemID,
        signature,
        expiresAt,
        AUTO_UPDATE_RETRY_MS,
      );
      return;
    }
    watchForMetadataChanges(itemID, signature, expiresAt);
  } catch (error) {
    pendingAutoUpdates.delete(itemID);
    reportPluginError(error, {
      feature: "EasyScholar",
      operation: "自动更新期刊信息",
      userMessage: "EasyScholar 自动更新失败。",
      notify: false,
      metadata: { itemID },
    });
  }
}

function watchForMetadataChanges(
  itemID: number,
  signature: string,
  expiresAt: number,
): void {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) {
    pendingAutoUpdates.delete(itemID);
    return;
  }
  const timer = setTimeout(() => pendingAutoUpdates.delete(itemID), remaining);
  pendingAutoUpdates.set(itemID, { timer, expiresAt, signature });
}

function registerMenu(win: _ZoteroTypes.MainWindow): void {
  const doc = win.document;
  if (doc.getElementById(EASY_SCHOLAR_MENU_ID)) return;
  const popup = doc.getElementById("zotero-itemmenu");
  if (!popup) return;
  const item = doc.createXULElement("menuitem");
  item.id = EASY_SCHOLAR_MENU_ID;
  item.setAttribute("label", "更新 EasyScholar 信息");
  const updateVisibility = () => {
    const selected = win.ZoteroPane.getSelectedItems();
    item.setAttribute(
      "hidden",
      String(selected.length !== 1 || !selected[0].isRegularItem()),
    );
  };
  popup.addEventListener("popupshowing", updateVisibility);
  item.addEventListener("command", () => void runUpdate(win));
  popup.appendChild(item);
}

async function runUpdate(win: _ZoteroTypes.MainWindow): Promise<void> {
  const item = win.ZoteroPane.getSelectedItems()[0];
  if (!item?.isRegularItem()) return;
  try {
    const result = await updateEasyScholarItem(item);
    if (result.status === "success") {
      Zotero.ItemTreeManager.refreshColumns();
      win.alert(
        `EasyScholar 信息已更新。\n匹配名称：${result.matchedName}${result.resolvedPublishedVersion ? "\n该名称来自识别到的正式发表版本，未修改原条目元数据。" : ""}`,
      );
      return;
    }
    if (result.status === "missing-venue") {
      win.alert("该条目缺少可用于查询的刊名、会议名或论文集名称。");
      return;
    }
    const attempted = result.attemptedNames
      .map((name) => `• ${name}`)
      .join("\n");
    win.alert(
      result.status === "no-selected-data"
        ? `EasyScholar 找到了刊物，但没有返回设置中所选的字段。\n\n已尝试：\n${attempted}`
        : `EasyScholar 未找到该期刊或会议。\n\n已尝试：\n${attempted}`,
    );
  } catch (error) {
    reportPluginError(error, {
      feature: "EasyScholar",
      operation: "手动更新期刊信息",
      userMessage: "更新 EasyScholar 信息失败。",
      window: win,
      metadata: { itemID: item.id },
    });
  }
}

export function unregisterEasyScholarFeature(win: Window): void {
  win.document.getElementById(EASY_SCHOLAR_MENU_ID)?.remove();
}

export function shutdownEasyScholarFeature(): void {
  for (const pending of pendingAutoUpdates.values())
    clearTimeout(pending.timer);
  pendingAutoUpdates.clear();
  if (notifierID) {
    Zotero.Notifier.unregisterObserver(notifierID);
    notifierID = undefined;
  }
  if (columnDataKey) {
    Zotero.ItemTreeManager.unregisterColumn(columnDataKey);
    columnDataKey = undefined;
  }
}
