import {
  generateAiTags,
  previewAiTags,
  replaceManualTags,
} from "../../modules/aiTagging";
import { reportPluginError } from "../../platform/errorReporter";

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
    const manualCount = item.getTags().filter((tag) => tag.type !== 1).length;
    const tags = await previewAiTags(suggested, manualCount);
    if (!tags?.length) return;
    await replaceManualTags(item, tags);
  } catch (error) {
    reportPluginError(error, {
      feature: "AI 标签",
      operation: "生成并写入标签",
      userMessage: "AI 生成标签失败。",
      window: win,
      metadata: { itemID: item.id },
    });
  }
}

export function unregisterAiTagFeature(win: Window): void {
  win.document.getElementById(AI_TAG_MENU_ID)?.remove();
}
