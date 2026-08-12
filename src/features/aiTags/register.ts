import {
  generateAiTags,
  previewAiTags,
  replaceManualTags,
} from "../../modules/aiTagging";

const AI_TAG_MENU_ID = "zotero-puls-ai-tag-menuitem";

export function registerAiTagFeature(win: _ZoteroTypes.MainWindow): void {
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
    )
      return;
    await replaceManualTags(item, tags);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "生成标签时发生未知错误";
    win.alert(`AI 生成标签失败：${message}`);
  }
}

export function unregisterAiTagFeature(win: Window): void {
  win.document.getElementById(AI_TAG_MENU_ID)?.remove();
}
