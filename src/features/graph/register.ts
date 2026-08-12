import { graphWindowController } from "../../modules/graphWindow";

const TOOLBAR_BUTTON_ID = "zotero-puls-graph-button";

export function registerGraphFeature(win: _ZoteroTypes.MainWindow): void {
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

export function unregisterGraphFeature(win: Window): void {
  win.document.getElementById(TOOLBAR_BUTTON_ID)?.remove();
}

export function shutdownGraphFeature(): void {
  graphWindowController.close();
}
