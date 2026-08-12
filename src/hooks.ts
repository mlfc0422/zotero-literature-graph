import { createZToolkit } from "./utils/ztoolkit";
import { buildCurrentCollectionGraph } from "./modules/graphData";
import { graphWindowController } from "./modules/graphWindow";
import {
  generateAiTags,
  previewAiTags,
  replaceManualTags,
} from "./modules/aiTagging";

const TOOLBAR_BUTTON_ID = "zotero-puls-graph-button";
const AI_TAG_MENU_ID = "zotero-puls-ai-tag-menuitem";

async function onStartup(): Promise<void> {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
  await registerPreferencesPane();
  addon.data.initialized = true;
}

async function registerPreferencesPane(): Promise<void> {
  await Zotero.PreferencePanes.register({
    pluginID: addon.data.config.addonID,
    id: "zotero-puls-preferences",
    src: `chrome://${addon.data.config.addonRef}/content/preferences.xhtml`,
    scripts: [`chrome://${addon.data.config.addonRef}/content/preferences.js`],
  });
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  addon.data.ztoolkit = createZToolkit();
  registerToolbarButton(win);
  registerAiTagMenu(win);
}

function registerAiTagMenu(win: _ZoteroTypes.MainWindow): void {
  const doc = win.document;
  if (doc.getElementById(AI_TAG_MENU_ID)) return;
  const popup = doc.getElementById("zotero-itemmenu");
  if (!popup) return;
  const item = doc.createXULElement("menuitem");
  item.id = AI_TAG_MENU_ID;
  item.setAttribute("label", "AI 生成标签");
  const updateVisibility = () => {
    const selected = win.ZoteroPane.getSelectedItems();
    item.setAttribute(
      "hidden",
      String(selected.length !== 1 || !selected[0].isRegularItem()),
    );
  };
  popup.addEventListener("popupshowing", updateVisibility);
  item.addEventListener("command", () => void runAiTagging(win));
  popup.appendChild(item);
}

async function runAiTagging(win: _ZoteroTypes.MainWindow): Promise<void> {
  const item = win.ZoteroPane.getSelectedItems()[0];
  if (!item?.isRegularItem()) return;
  try {
    const suggested = await generateAiTags(item);
    const tags = await previewAiTags(win, suggested);
    if (!tags?.length) return;
    const manualCount = item.getTags().filter((tag) => tag.type !== 1).length;
    if (
      !win.confirm(
        `将替换该论文的 ${manualCount} 个手动标签。自动标签不会受到影响。是否继续？`,
      )
    ) {
      return;
    }
    await replaceManualTags(item, tags);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "生成标签时发生未知错误";
    win.alert(`AI 生成标签失败：${message}`);
  }
}

function registerToolbarButton(win: _ZoteroTypes.MainWindow): void {
  const doc = win.document;
  if (doc.getElementById(TOOLBAR_BUTTON_ID)) return;

  const toolbar =
    doc.getElementById("zotero-items-toolbar") ||
    doc.getElementById("zotero-items-toolbar-container");
  if (!toolbar) {
    ztoolkit.log("Could not find Zotero items toolbar");
    return;
  }

  const button = doc.createXULElement("toolbarbutton");
  button.id = TOOLBAR_BUTTON_ID;
  button.setAttribute("label", "关系网");
  button.setAttribute("tooltiptext", "打开当前分类的作者—标签关系网");
  button.setAttribute("class", "toolbarbutton-1");
  button.setAttribute(
    "image",
    `chrome://${addon.data.config.addonRef}/content/icons/network.svg`,
  );
  button.addEventListener("command", () =>
    graphWindowController.openOrRefresh(win),
  );
  toolbar.appendChild(button);
}

async function onMainWindowUnload(win: Window): Promise<void> {
  win.document.getElementById(TOOLBAR_BUTTON_ID)?.remove();
  win.document.getElementById(AI_TAG_MENU_ID)?.remove();
}

function onShutdown(): void {
  graphWindowController.close();
  for (const win of Zotero.getMainWindows()) {
    win.document.getElementById(TOOLBAR_BUTTON_ID)?.remove();
    win.document.getElementById(AI_TAG_MENU_ID)?.remove();
  }
  ztoolkit.unregisterAll();
  addon.data.alive = false;
  // @ts-expect-error Plugin instance is intentionally removed on shutdown
  delete Zotero[addon.data.config.addonInstance];
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
};

export const pluginApi = {
  buildCurrentCollectionGraph,
  openGraphWindow: (win?: _ZoteroTypes.MainWindow) =>
    graphWindowController.openOrRefresh(win),
};
