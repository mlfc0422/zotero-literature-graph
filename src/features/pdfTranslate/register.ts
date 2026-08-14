import { translatePdfSelection } from "../../modules/pdfTranslation";
import { zoteroPreferenceStore } from "../../platform/zoteroServices";

const PREF_KEY = "extensions.zotero.zoteropuls.ai.pdfAutoTranslate";
const selectionTokens = new Map<string, number>();
let registered = false;

const onTextSelection = (
  event: _ZoteroTypes.Reader.EventParams<"renderTextSelectionPopup">,
): void => {
  if (!isPdfAutoTranslateEnabled()) return;
  const text = event.params.annotation.text.trim();
  if (!text) return;

  const token = (selectionTokens.get(event.reader._instanceID) ?? 0) + 1;
  selectionTokens.set(event.reader._instanceID, token);
  const panel = event.doc.createElement("div");
  panel.className = "zotero-puls-selection-translation";
  panel.style.cssText =
    "width:calc(100% - 8px);margin:6px 4px 2px;padding:7px 9px;box-sizing:border-box;border-radius:6px;background:var(--color-sidepane,#f5f6f7);color:var(--fill-primary,#1f2937);font:inherit;font-size:0.92em;line-height:1.5;white-space:pre-wrap;user-select:text;pointer-events:auto";
  panel.textContent = "正在翻译…";
  event.append(panel);

  void translateSelection(text, event.reader._instanceID, token, panel);
};

export function registerPdfTranslateFeature(): void {
  if (registered) return;
  Zotero.Reader.registerEventListener(
    "renderTextSelectionPopup",
    onTextSelection,
    addon.data.config.addonID,
  );
  registered = true;
}

export function unregisterPdfTranslateFeature(): void {
  if (!registered) return;
  Zotero.Reader.unregisterEventListener(
    "renderTextSelectionPopup",
    onTextSelection,
  );
  selectionTokens.clear();
  registered = false;
}

export function isPdfAutoTranslateEnabled(): boolean {
  return zoteroPreferenceStore.get(PREF_KEY, true) !== false;
}

async function translateSelection(
  text: string,
  readerID: string,
  token: number,
  panel: HTMLElement,
): Promise<void> {
  try {
    const translation = await translatePdfSelection(text);
    if (selectionTokens.get(readerID) === token && panel.isConnected)
      panel.textContent = translation;
  } catch (error) {
    if (selectionTokens.get(readerID) !== token || !panel.isConnected) return;
    const message = error instanceof Error ? error.message : String(error);
    panel.textContent = `翻译失败：${message}`;
  }
}
