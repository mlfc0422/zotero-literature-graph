import {
  isEasyScholarAutoUpdateEnabled,
  isEasyScholarConfigured,
  updateEasyScholarItem,
} from "../../modules/easyScholar";
import { extractEasyScholarSummary } from "./core";

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
    zoteroPersist: ["width", "hidden", "sortDirection"],
  });
  if (registered) columnDataKey = registered;
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
