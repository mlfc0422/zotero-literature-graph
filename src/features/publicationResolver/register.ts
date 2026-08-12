import {
  applyPublishedVersion,
  findPublishedVersion,
  isArxivItem,
} from "../../modules/publicationResolver";

const MENU_ID = "zotero-puls-find-published-version";

export function registerPublicationResolverFeature(
  win: _ZoteroTypes.MainWindow,
): void {
  const doc = win.document;
  if (doc.getElementById(MENU_ID)) return;
  const popup = doc.getElementById("zotero-itemmenu");
  if (!popup) return;
  const menu = doc.createXULElement("menuitem");
  menu.id = MENU_ID;
  menu.setAttribute("label", "查找正式发表版本");
  popup.addEventListener("popupshowing", () => {
    const selected = win.ZoteroPane.getSelectedItems();
    menu.setAttribute(
      "hidden",
      String(
        selected.length !== 1 ||
          !selected[0].isRegularItem() ||
          !isArxivItem(selected[0]),
      ),
    );
  });
  menu.addEventListener("command", () => void runLookup(win));
  popup.appendChild(menu);
}

async function runLookup(win: _ZoteroTypes.MainWindow): Promise<void> {
  const item = win.ZoteroPane.getSelectedItems()[0];
  if (!item?.isRegularItem()) return;
  try {
    const version = await findPublishedVersion(item);
    if (!version) {
      win.alert("当前未发现可信的正式发表版本。这篇预印本可能尚未正式发表。");
      return;
    }
    const confidence = `${Math.round(version.confidence * 100)}%`;
    const details = [
      `正式刊物或会议：${version.venue}`,
      version.doi ? `DOI：${version.doi}` : "",
      version.year ? `年份：${version.year}` : "",
      `数据来源：${version.source}`,
      `匹配置信度：${confidence}`,
    ]
      .filter(Boolean)
      .join("\n");
    if (
      win.confirm(
        `${details}\n\n是否将可写入的信息补充到当前 Zotero 条目？\n不会更改条目类型，无法直接写入的刊物信息将保存到“其他”字段。`,
      )
    ) {
      await applyPublishedVersion(item, version);
      win.alert("正式发表版本信息已补充到当前条目。");
    }
  } catch (error) {
    win.alert(
      `查找正式发表版本失败：${error instanceof Error ? error.message : error}`,
    );
  }
}

export function unregisterPublicationResolverFeature(win: Window): void {
  win.document.getElementById(MENU_ID)?.remove();
}
