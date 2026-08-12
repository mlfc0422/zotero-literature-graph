import {
  isEasyScholarAutoUpdateEnabled,
  isEasyScholarConfigured,
  updateEasyScholarItem,
} from "../../modules/easyScholar";
import {
  classifyEasyScholarValue,
  extractEasyScholarSummary,
  type EasyScholarRankTier,
} from "./core";

const EASY_SCHOLAR_MENU_ID = "zotero-puls-easyscholar-menuitem";
let notifierID: string | undefined;
let columnDataKey: string | undefined;

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
          event !== "add" ||
          type !== "item" ||
          !isEasyScholarAutoUpdateEnabled() ||
          !isEasyScholarConfigured()
        )
          return;
        for (const item of Zotero.Items.get(ids as number[])) {
          if (!item.isRegularItem()) continue;
          void updateEasyScholarItem(item).catch((error) =>
            ztoolkit.log("EasyScholar automatic update failed", error),
          );
        }
      },
    },
    ["item"],
    "zotero-puls-easyscholar",
  );
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
    const updated = await updateEasyScholarItem(item);
    if (updated) Zotero.ItemTreeManager.refreshColumns();
    win.alert(
      updated
        ? "EasyScholar 信息已更新到“其他”字段。"
        : "未找到可写入的 EasyScholar 信息，请检查期刊或会议名称。",
    );
  } catch (error) {
    win.alert(
      `更新 EasyScholar 信息失败：${error instanceof Error ? error.message : error}`,
    );
  }
}

export function unregisterEasyScholarFeature(win: Window): void {
  win.document.getElementById(EASY_SCHOLAR_MENU_ID)?.remove();
}

export function shutdownEasyScholarFeature(): void {
  if (notifierID) {
    Zotero.Notifier.unregisterObserver(notifierID);
    notifierID = undefined;
  }
  if (columnDataKey) {
    Zotero.ItemTreeManager.unregisterColumn(columnDataKey);
    columnDataKey = undefined;
  }
}
