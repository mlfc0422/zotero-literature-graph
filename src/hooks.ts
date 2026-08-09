import { createZToolkit } from "./utils/ztoolkit";
import { buildCurrentCollectionGraph } from "./modules/graphData";
import { graphWindowController } from "./modules/graphWindow";

const TOOLBAR_BUTTON_ID = "zotero-puls-graph-button";

async function onStartup(): Promise<void> {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  addon.data.ztoolkit = createZToolkit();
  registerToolbarButton(win);
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
}

function onShutdown(): void {
  graphWindowController.close();
  for (const win of Zotero.getMainWindows()) {
    win.document.getElementById(TOOLBAR_BUTTON_ID)?.remove();
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
