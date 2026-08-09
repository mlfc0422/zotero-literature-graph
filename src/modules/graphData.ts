export type GraphNodeType = "author" | "tag";

export interface PaperRecord {
  id: number;
  title: string;
  year: string;
  firstCreator: string;
  authors: string[];
  tags: string[];
}

export type GraphPaper = PaperRecord;

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  paperIds: number[];
  count: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  paperIds: number[];
  weight: number;
}

export interface GraphData {
  collection: { id: number; name: string };
  papers: Record<number, GraphPaper>;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphDataError extends Error {
  constructor(
    public readonly code:
      "NO_COLLECTION" | "EMPTY_COLLECTION" | "NO_RELATIONSHIPS",
    message: string,
  ) {
    super(message);
    this.name = "GraphDataError";
  }
}

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeTag(value: string): string {
  return value.trim();
}

function uniqueNormalized(
  values: string[],
  normalize: (value: string) => string,
): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const display = normalize(value);
    if (!display) continue;
    const key = display.toLocaleLowerCase();
    if (!seen.has(key)) seen.set(key, display);
  }
  return [...seen.values()];
}

export function buildGraphData(
  collection: { id: number; name: string },
  records: PaperRecord[],
): GraphData {
  if (!records.length) {
    throw new GraphDataError("EMPTY_COLLECTION", "当前分类中没有论文");
  }

  const papers: Record<number, GraphPaper> = {};
  const nodeMap = new Map<string, { node: GraphNode; paperIds: Set<number> }>();
  const edgeMap = new Map<string, { edge: GraphEdge; paperIds: Set<number> }>();

  const ensureNode = (type: GraphNodeType, label: string, paperId: number) => {
    const id = `${type}:${label.toLocaleLowerCase()}`;
    let entry = nodeMap.get(id);
    if (!entry) {
      entry = {
        node: { id, label, type, paperIds: [], count: 0 },
        paperIds: new Set(),
      };
      nodeMap.set(id, entry);
    }
    entry.paperIds.add(paperId);
    return id;
  };

  for (const record of records) {
    const authors = uniqueNormalized(record.authors, normalizeName);
    const tags = uniqueNormalized(record.tags, normalizeTag);
    papers[record.id] = { ...record, authors, tags };
    if (!authors.length || !tags.length) continue;

    for (const author of authors) {
      const authorId = ensureNode("author", author, record.id);
      for (const tag of tags) {
        const tagId = ensureNode("tag", tag, record.id);
        const edgeId = `${authorId}|${tagId}`;
        let entry = edgeMap.get(edgeId);
        if (!entry) {
          entry = {
            edge: {
              id: edgeId,
              source: authorId,
              target: tagId,
              paperIds: [],
              weight: 0,
            },
            paperIds: new Set(),
          };
          edgeMap.set(edgeId, entry);
        }
        entry.paperIds.add(record.id);
      }
    }
  }

  const nodes = [...nodeMap.values()].map(({ node, paperIds }) => ({
    ...node,
    paperIds: [...paperIds],
    count: paperIds.size,
  }));
  const edges = [...edgeMap.values()].map(({ edge, paperIds }) => ({
    ...edge,
    paperIds: [...paperIds],
    weight: paperIds.size,
  }));

  if (!edges.length) {
    throw new GraphDataError(
      "NO_RELATIONSHIPS",
      "当前分类中没有同时包含作者和标签的论文",
    );
  }

  return { collection, papers, nodes, edges };
}

function creatorName(creator: _ZoteroTypes.Item.CreatorJSON): string {
  if ("name" in creator) return normalizeName(creator.name || "");
  return normalizeName(
    [creator.firstName, creator.lastName].filter(Boolean).join(" "),
  );
}

export function buildCurrentCollectionGraph(
  win: _ZoteroTypes.MainWindow = Zotero.getMainWindow(),
): GraphData {
  const pane = (win as unknown as { ZoteroPane: _ZoteroTypes.ZoteroPane })
    .ZoteroPane;
  const collection = pane.getSelectedCollection();
  if (!collection) {
    throw new GraphDataError("NO_COLLECTION", "请先在左侧选择一个普通分类");
  }

  const records = collection
    .getChildItems(false, false)
    .filter(
      (item) =>
        item.isRegularItem() &&
        !(item as Zotero.Item & { isFeedItem?: boolean }).isFeedItem,
    )
    .map((item): PaperRecord => {
      const creators = item
        .getCreatorsJSON()
        .filter((creator) => creator.creatorType === "author")
        .map(creatorName)
        .filter(Boolean);
      const date = String(item.getField("date", true, true) || "");
      return {
        id: item.id,
        title: String(item.getField("title") || "（无标题）"),
        year: date.match(/\d{4}/)?.[0] || "",
        firstCreator: String(
          item.getField("firstCreator") || creators[0] || "",
        ),
        authors: creators,
        // Zotero uses type 1 for automatically generated tags. They can be
        // extremely numerous and make a relationship graph unreadable.
        tags: item
          .getTags()
          .filter(({ type }) => type !== 1)
          .map(({ tag }) => tag),
      };
    });

  return buildGraphData(
    { id: collection.id, name: collection.name || "未命名分类" },
    records,
  );
}
