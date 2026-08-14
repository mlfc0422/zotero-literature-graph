import { countCollectionPapers } from "./core";

const TREE_ID = "collection-tree";
const ROW_SELECTOR = '.row[role="treeitem"][id^="collection-tree-row-"]';
const COUNT_CLASS = "zotero-puls-collection-count";

interface CollectionCountState {
  observer?: MutationObserver;
  timer?: number;
  tree?: HTMLElement;
  onScroll?: () => void;
}

const states = new WeakMap<Window, CollectionCountState>();
let notifierID: string | undefined;

export function registerCollectionCountFeature(
  win: _ZoteroTypes.MainWindow,
): void {
  if (states.has(win)) return;
  const state: CollectionCountState = {};
  states.set(win, state);
  attachToCollectionTree(win, state);
}

export function registerCollectionCountNotifier(): void {
  if (notifierID) return;
  notifierID = Zotero.Notifier.registerObserver(
    {
      notify: () => {
        for (const win of Zotero.getMainWindows()) scheduleRefresh(win);
      },
    },
    ["collection", "collection-item"],
    "zotero-puls-collection-counts",
  );
}

export function unregisterCollectionCountFeature(win: Window): void {
  const state = states.get(win);
  if (!state) return;
  if (state.timer) clearTimeout(state.timer);
  state.observer?.disconnect();
  if (state.tree && state.onScroll)
    state.tree.removeEventListener("scroll", state.onScroll, true);
  win.document
    .querySelectorAll(`.${COUNT_CLASS}`)
    .forEach((node: Element) => node.remove());
  states.delete(win);
}

export function shutdownCollectionCountFeature(): void {
  if (notifierID) {
    Zotero.Notifier.unregisterObserver(notifierID);
    notifierID = undefined;
  }
}

function attachToCollectionTree(
  win: _ZoteroTypes.MainWindow,
  state: CollectionCountState,
): void {
  const tree = win.document.getElementById(TREE_ID) as HTMLElement | null;
  if (!tree) {
    state.timer = win.setTimeout(() => attachToCollectionTree(win, state), 250);
    return;
  }
  state.tree = tree;
  state.onScroll = () => scheduleRefresh(win);
  tree.addEventListener("scroll", state.onScroll, true);
  const observer = new win.MutationObserver(() => scheduleRefresh(win));
  state.observer = observer;
  observer.observe(tree, { childList: true, subtree: true });
  refreshCollectionCounts(win);
}

function scheduleRefresh(win: _ZoteroTypes.MainWindow): void {
  const state = states.get(win);
  if (!state || state.timer) return;
  state.timer = win.setTimeout(() => {
    state.timer = undefined;
    refreshCollectionCounts(win);
  }, 0);
}

function refreshCollectionCounts(win: _ZoteroTypes.MainWindow): void {
  const tree = win.document.getElementById(TREE_ID);
  const view = win.ZoteroPane.collectionsView;
  if (!tree || !view) return;

  const elements = Array.from(
    tree.querySelectorAll(ROW_SELECTOR),
  ) as HTMLElement[];
  for (const element of elements) {
    const index = getRowIndex(element.id);
    const row = index === undefined ? undefined : view.getRow(index);
    const cell = element.querySelector(
      ".cell.label.primary",
    ) as HTMLElement | null;
    const existing = element.querySelector(
      `.${COUNT_CLASS}`,
    ) as HTMLElement | null;
    if (!row?.isCollection() || !cell) {
      existing?.remove();
      continue;
    }

    const collection = row.ref as Zotero.Collection;
    const count = countCollectionPapers(collection.getChildItems(false, false));
    const label = String(count);
    let badge = existing as HTMLElement | null;
    if (!badge) {
      badge = win.document.createElement("span");
      badge.className = COUNT_CLASS;
      badge.style.cssText =
        "margin-inline-start:auto;padding-inline-start:8px;color:var(--fill-secondary,#98a2b3);font-size:0.9em;font-variant-numeric:tabular-nums;pointer-events:none";
      cell.appendChild(badge);
    }
    if (badge.textContent !== label) badge.textContent = label;
    badge.title = `直接包含 ${label} 篇论文`;
  }
}

function getRowIndex(id: string): number | undefined {
  const match = /^collection-tree-row-(\d+)$/.exec(id);
  return match ? Number(match[1]) : undefined;
}
