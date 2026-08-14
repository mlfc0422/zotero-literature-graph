export interface CountableItem {
  isRegularItem(): boolean;
}

/** Counts only top-level bibliographic items shown as papers in a collection. */
export function countCollectionPapers(items: CountableItem[]): number {
  return items.reduce((count, item) => count + Number(item.isRegularItem()), 0);
}
