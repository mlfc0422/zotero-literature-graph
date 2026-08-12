export function getMainWindow(): _ZoteroTypes.MainWindow {
  return Zotero.getMainWindow();
}

export function focusAndSelectItem(id: number): void {
  const win = getMainWindow();
  win.focus();
  void win.ZoteroPane.selectItems([id]);
}
