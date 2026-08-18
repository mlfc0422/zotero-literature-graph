import { formatReadAt } from "./core";
import {
  getReadingStatus,
  getReadingStatusItem,
  setReadingStatus,
} from "../../modules/readingStatus";
import { reportPluginError } from "../../platform/errorReporter";

const MENU_ID = "zotero-puls-reading-status-menuitem";
const READER_EVENT = "renderToolbar";
const READER_BUTTON_ATTRIBUTE = "data-zotero-puls-reading-item";
let readerRegistered = false;
const readerDocumentListeners = new WeakSet<Document>();
const savingReadingItems = new Set<number>();

interface ReadingRowState {
  observer?: MutationObserver;
  scheduled: boolean;
  timer?: number;
}

interface ReadingMenuState {
  popup: Element;
  onPopupShowing: EventListener;
}

const readingRowStates = new Map<Window, ReadingRowState>();
const readingMenuStates = new Map<Window, ReadingMenuState>();

export function registerReadingStatusFeature(
  win: _ZoteroTypes.MainWindow,
): void {
  registerReadingStatusRows(win);
  registerReadingMenu(win);
}

export function registerReadingStatusReaderFeature(): void {
  if (readerRegistered) return;
  Zotero.Reader.registerEventListener(
    READER_EVENT,
    onReaderToolbar,
    addon.data.config.addonID,
  );
  readerRegistered = true;
}

export function unregisterReadingStatusFeature(win: Window): void {
  const rowState = readingRowStates.get(win);
  rowState?.observer?.disconnect();
  if (rowState?.timer) win.clearTimeout(rowState.timer);
  readingRowStates.delete(win);
  const menuState = readingMenuStates.get(win);
  menuState?.popup.removeEventListener(
    "popupshowing",
    menuState.onPopupShowing,
  );
  readingMenuStates.delete(win);
  win.document.getElementById(MENU_ID)?.remove();
}

export function shutdownReadingStatusFeature(): void {
  if (readerRegistered) {
    Zotero.Reader.unregisterEventListener(READER_EVENT, onReaderToolbar);
    readerRegistered = false;
  }
  for (const state of readingRowStates.values()) state.observer?.disconnect();
  readingRowStates.clear();
  for (const state of readingMenuStates.values()) {
    state.popup.removeEventListener("popupshowing", state.onPopupShowing);
  }
  readingMenuStates.clear();
  savingReadingItems.clear();
}

function onReaderToolbar(
  event: _ZoteroTypes.Reader.EventParams<typeof READER_EVENT>,
): void {
  const readerItem = event.reader.itemID
    ? Zotero.Items.get(event.reader.itemID)
    : undefined;
  if (!readerItem) return;
  const target = getReadingStatusItem(readerItem);
  if (!target) return;
  ensureReaderDocumentListeners(event.doc);
  const button = event.doc.createElement("button");
  button.type = "button";
  button.setAttribute(READER_BUTTON_ATTRIBUTE, String(target.id));
  button.style.cssText =
    "margin-inline-start:6px;border:1px solid var(--material-border,#d0d5dd);border-radius:6px;padding:4px 8px;background:var(--material-background,#fff);color:var(--fill-primary,#344054);font:inherit;font-size:12px;cursor:pointer;pointer-events:auto;position:relative;z-index:1";
  updateReaderButton(button, getReadingStatus(target));
  event.append(button);
  updateReaderButtons(event.doc, target.id);
}

function ensureReaderDocumentListeners(doc: Document): void {
  if (readerDocumentListeners.has(doc)) return;
  const activate = (event: Event) => {
    const eventTarget = event.target as Element | null;
    const button = eventTarget?.closest?.(
      `button[${READER_BUTTON_ATTRIBUTE}]`,
    ) as HTMLButtonElement | null;
    if (!button) return;
    if ((event as MouseEvent).button && (event as MouseEvent).button !== 0)
      return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const itemID = Number(button.getAttribute(READER_BUTTON_ATTRIBUTE));
    if (!Number.isInteger(itemID)) return;
    void toggleReaderStatus(doc, itemID);
  };
  const click: EventListener = (event) => activate(event);
  const keyDown: EventListener = (event) => {
    const key = (event as KeyboardEvent).key;
    if (key === "Enter" || key === " ") activate(event);
  };
  doc.addEventListener("click", click, true);
  doc.addEventListener("keydown", keyDown, true);
  readerDocumentListeners.add(doc);
}

async function toggleReaderStatus(
  doc: Document,
  itemID: number,
): Promise<void> {
  if (savingReadingItems.has(itemID)) return;
  const item = Zotero.Items.get(itemID);
  const target = item && getReadingStatusItem(item);
  if (!target) return;
  savingReadingItems.add(itemID);
  updateReaderButtons(doc, itemID, "saving");
  try {
    await setReadingStatus(target, !getReadingStatus(target).read);
    for (const win of Zotero.getMainWindows()) refreshItemsView(win);
    updateReaderButtons(doc, itemID);
  } catch (error) {
    const reported = reportPluginError(error, {
      feature: "阅读状态",
      operation: "阅读器按钮切换状态",
      userMessage: "更新阅读状态失败。",
      notify: false,
      metadata: { itemID },
    });
    updateReaderButtons(doc, itemID, "error", reported.message);
  } finally {
    savingReadingItems.delete(itemID);
  }
}

function updateReaderButtons(
  doc: Document,
  itemID: number,
  state: "idle" | "saving" | "error" = "idle",
  errorMessage = "",
): void {
  const buttons = doc.querySelectorAll<HTMLButtonElement>(
    `button[${READER_BUTTON_ATTRIBUTE}="${itemID}"]`,
  );
  const item = Zotero.Items.get(itemID);
  const status = item ? getReadingStatus(item) : { read: false };
  for (const button of buttons) {
    button.disabled = state === "saving";
    if (state === "saving") {
      button.textContent = "正在保存…";
      button.title = "正在保存阅读状态";
    } else if (state === "error") {
      button.textContent = "保存失败";
      button.title = `保存阅读状态失败：${errorMessage}`;
    } else {
      updateReaderButton(button, status);
    }
  }
}

function updateReaderButton(
  button: HTMLButtonElement,
  status: { read: boolean; readAt?: string },
): void {
  button.disabled = false;
  button.textContent = status.read ? "✓ 已读" : "○ 标记已读";
  button.title = status.read
    ? `${formatReadAt(status.readAt)}；单击恢复未读`
    : "单击标记为已读";
  button.setAttribute("aria-pressed", String(status.read));
}

function registerReadingStatusRows(win: _ZoteroTypes.MainWindow): void {
  if (readingRowStates.has(win)) return;
  const tree = win.document.getElementById("zotero-items-tree");
  const Observer = win.document.defaultView?.MutationObserver;
  if (!tree || !Observer) return;
  const state: ReadingRowState = { scheduled: false };
  const scheduleDecoration = () => {
    if (state.scheduled) return;
    state.scheduled = true;
    state.timer = win.setTimeout(() => {
      state.scheduled = false;
      state.timer = undefined;
      if (readingRowStates.get(win) !== state) return;
      decorateReadingStatusRows(win, tree);
    }, 0);
  };
  const observer = new Observer(scheduleDecoration);
  state.observer = observer;
  observer.observe(tree, { childList: true, subtree: true });
  readingRowStates.set(win, state);
  scheduleDecoration();
}

function decorateReadingStatusRows(
  win: _ZoteroTypes.MainWindow,
  tree: Element,
): void {
  const view = win.ZoteroPane.itemsView;
  if (!view) return;
  for (const row of tree.querySelectorAll<HTMLElement>(".row[id]")) {
    const match = row.id.match(/-row-(\d+)$/);
    if (!match) continue;
    const treeRow = view.getRow(Number(match[1])) as
      { ref?: Zotero.Item } | undefined;
    const item = treeRow?.ref;
    const target = item && getReadingStatusItem(item);
    row.style.boxSizing = "border-box";
    row.style.borderInlineStart = target
      ? `3px solid ${getReadingStatus(target).read ? "#20815d" : "#d0d5dd"}`
      : "3px solid transparent";
  }
}

function refreshItemsView(win: _ZoteroTypes.MainWindow): void {
  const view = win.ZoteroPane.itemsView;
  if (view) void view.refresh();
}

function registerReadingMenu(win: _ZoteroTypes.MainWindow): void {
  const doc = win.document;
  if (doc.getElementById(MENU_ID)) return;
  const popup = doc.getElementById("zotero-itemmenu");
  if (!popup) return;
  const menu = doc.createXULElement("menuitem");
  menu.id = MENU_ID;
  const update = () => {
    const item = win.ZoteroPane.getSelectedItems()[0];
    const target = item && getReadingStatusItem(item);
    menu.setAttribute("hidden", String(!target));
    if (target)
      menu.setAttribute(
        "label",
        getReadingStatus(target).read ? "标记为未读" : "标记为已读",
      );
  };
  popup.addEventListener("popupshowing", update);
  readingMenuStates.set(win, { popup, onPopupShowing: update });
  menu.addEventListener("command", () => {
    const item = win.ZoteroPane.getSelectedItems()[0];
    const target = item && getReadingStatusItem(item);
    if (!target) return;
    void setReadingStatus(target, !getReadingStatus(target).read)
      .then(() => refreshItemsView(win))
      .catch((error) => {
        reportPluginError(error, {
          feature: "阅读状态",
          operation: "右键菜单切换状态",
          userMessage: "更新阅读状态失败。",
          window: win,
          metadata: { itemID: target.id },
        });
      });
  });
  popup.appendChild(menu);
}
