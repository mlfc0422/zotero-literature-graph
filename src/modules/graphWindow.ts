import type cytoscape from "cytoscape";
import type { GraphData, GraphNode } from "./graphData";
import { buildCurrentCollectionGraph, GraphDataError } from "./graphData";
import { isWindowAlive } from "../utils/window";

let createCytoscape: typeof cytoscape | undefined;

async function getCytoscape(win: Window): Promise<typeof cytoscape> {
  if (!createCytoscape) {
    // Cytoscape expects browser globals at module initialization. Zotero plugin
    // sandboxes do not expose them by default, despite having a real dialog DOM.
    _globalThis.window = win;
    _globalThis.document = win.document;
    _globalThis.navigator = win.navigator;
    _globalThis.console = win.console;
    _globalThis.HTMLElement = win.HTMLElement;
    _globalThis.HTMLCanvasElement = win.HTMLCanvasElement;
    _globalThis.CanvasRenderingContext2D = win.CanvasRenderingContext2D;
    _globalThis.Image = win.Image;
    _globalThis.getComputedStyle = win.getComputedStyle.bind(win);
    _globalThis.requestAnimationFrame = win.requestAnimationFrame.bind(win);
    _globalThis.cancelAnimationFrame = win.cancelAnimationFrame.bind(win);
    createCytoscape = (await import("cytoscape")).default;
  }
  return createCytoscape;
}

const STYLES = `
  :root { color-scheme: light dark; font: 14px system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; overflow: hidden; background: #f7f8fa; color: #202124; }
  #app { height: 680px; display: grid; grid-template-rows: auto 1fr; }
  header { display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: #fff; border-bottom: 1px solid #dfe1e5; }
  h1 { margin: 0 auto 0 0; font-size: 17px; white-space: nowrap; }
  label { display: flex; gap: 7px; align-items: center; white-space: nowrap; }
  input[type=search] { width: 220px; padding: 7px 10px; border: 1px solid #c8ccd1; border-radius: 6px; }
  main { min-height: 0; display: grid; grid-template-columns: 1fr 310px; }
  #canvas { min-width: 0; min-height: 0; background: radial-gradient(circle at center, #fff, #eef2f7); }
  aside { overflow: auto; background: #fff; border-left: 1px solid #dfe1e5; padding: 16px; }
  #summary { color: #5d6875; margin-bottom: 12px; font-weight: 600; }
  #legend { display: flex; gap: 12px; margin-bottom: 14px; color: #5d6875; font-size: 12px; }
  .legend-item { display: flex; align-items: center; gap: 5px; }
  .legend-dot { width: 10px; height: 10px; display: inline-block; border-radius: 50%; }
  .legend-dot.author { background: #4f46e5; }
  .legend-dot.tag { background: #059669; border-radius: 2px; }
  #gesture-help { color: #73777c; font-size: 12px; margin: -4px 0 15px; }
  #detail-title { margin: 0 0 10px; font-size: 16px; }
  #papers { list-style: none; padding: 0; margin: 0; }
  #papers li { padding: 9px 7px; border-bottom: 1px solid #eceff1; cursor: default; border-radius: 5px; }
  #papers li:hover { background: #edf4ff; }
  .paper-title { font-weight: 600; }
  .paper-meta { color: #73777c; font-size: 12px; margin-top: 3px; }
  #empty { display: none; padding: 32px; color: #62676d; text-align: center; }
  @media (prefers-color-scheme: dark) {
    body, #canvas { background: #202124; color: #e8eaed; }
    header, aside { background: #292a2d; border-color: #44464b; }
    #canvas { background: radial-gradient(circle at center, #292a2d, #202124); }
    input[type=search] { color: #e8eaed; background: #202124; border-color: #5f6368; }
    #papers li { border-color: #44464b; }
    #papers li:hover { background: #374151; }
  }
`;

function append<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  parent: Element,
  tag: K,
  options: { id?: string; className?: string; text?: string } = {},
): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tag);
  if (options.id) element.id = options.id;
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  parent.appendChild(element);
  return element;
}

export class GraphWindowController {
  private window?: Window;
  private cy?: cytoscape.Core;
  private resizeObserver?: ResizeObserver;
  private cleanups: Array<() => void> = [];
  private data?: GraphData;

  openOrRefresh(
    sourceWin: _ZoteroTypes.MainWindow = Zotero.getMainWindow(),
  ): void {
    if (isWindowAlive(this.window)) {
      this.window!.focus();
      void this.refresh(sourceWin);
      return;
    }

    const dialogData: Record<string, unknown> = {
      loadCallback: () => {
        this.window = dialog.window;
        try {
          this.buildShell(dialog.window.document);
          void this.refresh(sourceWin);
        } catch (error) {
          ztoolkit.log("Failed to initialize graph window", error);
          this.showFatalError(error);
        }
      },
      unloadCallback: () => this.disposeWindow(),
    };
    const dialog = new ztoolkit.Dialog(1, 1)
      .addCell(
        0,
        0,
        {
          tag: "div",
          namespace: "html",
          id: "zotero-puls-graph-root",
          styles: { width: "1120px", height: "680px" },
        },
        false,
      )
      .addButton("关闭", "close")
      .setDialogData(dialogData)
      .open("Zotero Puls · 作者—标签关系网", {
        width: 1200,
        height: 800,
        centerscreen: true,
        resizable: true,
        fitContent: false,
        noDialogMode: true,
      });
  }

  async refresh(
    sourceWin: _ZoteroTypes.MainWindow = Zotero.getMainWindow(),
  ): Promise<void> {
    if (!isWindowAlive(this.window)) return;
    try {
      this.data = buildCurrentCollectionGraph(sourceWin);
      await this.render(this.data);
    } catch (error) {
      ztoolkit.log("Failed to build or render author-tag graph", error);
      const detail = error instanceof Error ? `：${error.message}` : "";
      this.showEmpty(
        error instanceof GraphDataError
          ? error.message
          : `读取或渲染当前分类时发生错误${detail}`,
      );
    }
  }

  close(): void {
    if (isWindowAlive(this.window)) this.window!.close();
    this.disposeWindow();
  }

  private buildShell(doc: Document): void {
    const host = doc.getElementById("zotero-puls-graph-root");
    if (!host) throw new Error("图谱窗口容器未创建");
    if (!doc.getElementById("zotero-puls-graph-style")) {
      append(doc, doc.head!, "style", {
        id: "zotero-puls-graph-style",
        text: STYLES,
      });
    }
    host.replaceChildren();
    const app = append(doc, host, "div", { id: "app" });
    const header = append(doc, app, "header");
    append(doc, header, "h1", { id: "heading", text: "作者—标签关系网" });
    const search = append(doc, header, "input", { id: "search" });
    search.type = "search";
    search.placeholder = "搜索作者或标签";
    const thresholdLabel = append(doc, header, "label", {
      text: "最小关系权重",
    });
    const threshold = append(doc, thresholdLabel, "input", { id: "threshold" });
    threshold.type = "range";
    threshold.min = threshold.value = "1";
    append(doc, thresholdLabel, "span", { id: "threshold-value", text: "1" });
    const main = append(doc, app, "main");
    append(doc, main, "section", { id: "canvas" });
    const aside = append(doc, main, "aside");
    append(doc, aside, "div", { id: "summary", text: "点击节点查看关联论文" });
    const legend = append(doc, aside, "div", { id: "legend" });
    for (const [type, text] of [
      ["author", "第一作者"],
      ["tag", "标签"],
    ]) {
      const item = append(doc, legend, "span", { className: "legend-item" });
      append(doc, item, "i", { className: `legend-dot ${type}` });
      append(doc, item, "span", { text });
    }
    append(doc, aside, "div", {
      id: "gesture-help",
      text: "滚轮缩放；拖动画布平移。",
    });
    append(doc, aside, "h2", { id: "detail-title", text: "关联论文" });
    append(doc, aside, "ul", { id: "papers" });
    append(doc, aside, "div", { id: "empty" });
    const searchHandler = () => this.applySearch(search.value);
    const thresholdHandler = () => void this.render(this.data);
    search.addEventListener("input", searchHandler);
    threshold.addEventListener("input", thresholdHandler);
    this.cleanups.push(
      () => search.removeEventListener("input", searchHandler),
      () => threshold.removeEventListener("input", thresholdHandler),
    );
  }

  private async render(data?: GraphData): Promise<void> {
    const doc = this.window?.document;
    if (!doc || !data) return;
    this.cy?.destroy();
    this.resizeObserver?.disconnect();
    const slider = doc.getElementById("threshold") as HTMLInputElement;
    const maxWeight = Math.max(1, ...data.edges.map((edge) => edge.weight));
    slider.max = String(maxWeight);
    if (Number(slider.value) > maxWeight) slider.value = String(maxWeight);
    (doc.getElementById("threshold-value") as HTMLElement).textContent =
      slider.value;
    const edges = data.edges.filter(
      (edge) => edge.weight >= Number(slider.value),
    );
    const ids = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    const nodes = data.nodes.filter((node) => ids.has(node.id));
    if (!edges.length) return this.showEmpty("当前权重阈值下没有可显示的关系");
    this.hideEmpty();
    (doc.getElementById("heading") as HTMLElement).textContent =
      `${data.collection.name} · 作者—标签关系网`;
    (doc.getElementById("summary") as HTMLElement).textContent =
      `${Object.keys(data.papers).length} 篇论文 · ${nodes.length} 个节点 · ${edges.length} 条关系`;
    const container = doc.getElementById("canvas") as HTMLElement;
    // Cytoscape captures browser globals when it is first loaded. Use the
    // persistent Zotero main window rather than this closeable dialog window.
    const cytoscapeFactory = await getCytoscape(Zotero.getMainWindow());
    this.cy = cytoscapeFactory({
      container,
      elements: [
        ...nodes.map((node) => ({ data: { ...node }, classes: node.type })),
        ...edges.map((edge) => ({ data: { ...edge } })),
      ],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            color: "#263241",
            "font-size": 11,
            "font-weight": 600,
            "text-opacity": 0,
            "text-outline-color": "#ffffff",
            "text-outline-width": 3,
            width: "mapData(count, 1, 12, 18, 42)",
            height: "mapData(count, 1, 12, 18, 42)",
            "border-width": 2,
            "border-color": "#ffffff",
          },
        },
        {
          selector: "node.author",
          style: { shape: "ellipse", "background-color": "#4f46e5" },
        },
        {
          selector: "node.tag",
          style: { shape: "round-rectangle", "background-color": "#059669" },
        },
        {
          selector: "edge",
          style: {
            width: "mapData(weight, 1, 8, 1, 7)",
            "line-color": "#8b98a8",
            opacity: 0.3,
          },
        },
        {
          selector: ".selected",
          style: {
            "text-opacity": 1,
            "border-color": "#111827",
            "border-width": 4,
          },
        },
        { selector: ".match", style: { "text-opacity": 1 } },
        { selector: ".dimmed", style: { opacity: 0.08 } },
        {
          selector: "edge.active",
          style: { "line-color": "#d97706", opacity: 0.95 },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        fit: true,
        padding: 48,
        nodeRepulsion: () => 9000,
        idealEdgeLength: (edge) =>
          Math.max(70, 170 - Number(edge.data("weight")) * 10),
        gravity: 0.2,
      } as cytoscape.LayoutOptions,
      wheelSensitivity: 0.18,
      minZoom: 0.15,
      maxZoom: 5,
    });
    this.cy.on("tap", "node", (event) => {
      const node = data.nodes.find((entry) => entry.id === event.target.id());
      if (node) this.selectNode(node);
    });
    this.cy.on("mouseover", "node", (event) => event.target.addClass("match"));
    this.cy.on("mouseout", "node", (event) =>
      event.target.removeClass("match"),
    );
    const ResizeObserverClass = this.window?.ResizeObserver;
    if (ResizeObserverClass) {
      const resizeObserver = new ResizeObserverClass(() =>
        this.cy?.resize().fit(undefined, 48),
      );
      this.resizeObserver = resizeObserver;
      resizeObserver.observe(container);
    }
    this.applySearch((doc.getElementById("search") as HTMLInputElement).value);
  }

  private applySearch(query: string): void {
    if (!this.cy) return;
    const term = query.trim().toLocaleLowerCase();
    this.cy.nodes().forEach((node) => {
      node.toggleClass(
        "match",
        Boolean(
          term && String(node.data("label")).toLocaleLowerCase().includes(term),
        ),
      );
      node.toggleClass("dimmed", Boolean(term && !node.hasClass("match")));
    });
    this.cy.edges().forEach((edge) => {
      edge.toggleClass(
        "dimmed",
        Boolean(
          term &&
          !edge.source().hasClass("match") &&
          !edge.target().hasClass("match"),
        ),
      );
    });
  }

  private selectNode(node: GraphNode): void {
    if (!this.cy || !this.data) return;
    const current = this.cy.getElementById(node.id);
    const neighborhood = current.closedNeighborhood();
    this.cy.elements().addClass("dimmed").removeClass("selected active");
    neighborhood.removeClass("dimmed");
    current.addClass("selected");
    current.connectedEdges().addClass("active");
    const doc = this.window!.document;
    (doc.getElementById("detail-title") as HTMLElement).textContent =
      `${node.type === "author" ? "作者" : "标签"}：${node.label}`;
    const list = doc.getElementById("papers") as HTMLUListElement;
    list.replaceChildren();
    for (const id of node.paperIds) {
      const paper = this.data.papers[id];
      if (!paper) continue;
      const item = append(doc, list, "li");
      item.title = "双击后在 Zotero 中定位";
      append(doc, item, "div", { className: "paper-title", text: paper.title });
      append(doc, item, "div", {
        className: "paper-meta",
        text: [paper.firstCreator, paper.year].filter(Boolean).join(" · "),
      });
      item.addEventListener("dblclick", () => this.locatePaper(paper.id));
    }
  }

  private locatePaper(id: number): void {
    const mainWin = Zotero.getMainWindow();
    mainWin.focus();
    const pane = (mainWin as unknown as { ZoteroPane: _ZoteroTypes.ZoteroPane })
      .ZoteroPane;
    void pane.selectItems([id]);
  }

  private showEmpty(message: string): void {
    this.cy?.destroy();
    const doc = this.window?.document;
    if (!doc) return;
    const empty = doc.getElementById("empty") as HTMLElement;
    empty.textContent = message;
    empty.style.display = "block";
    (doc.getElementById("summary") as HTMLElement).textContent = message;
  }

  private hideEmpty(): void {
    const empty = this.window?.document.getElementById("empty") as
      HTMLElement | undefined;
    if (empty) empty.style.display = "none";
  }

  private showFatalError(error: unknown): void {
    const host = this.window?.document.getElementById("zotero-puls-graph-root");
    if (!host) return;
    host.textContent = `关系网窗口未能初始化：${error instanceof Error ? error.message : "未知错误"}`;
  }

  private disposeWindow(): void {
    this.cy?.destroy();
    this.cy = undefined;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.window = undefined;
    this.data = undefined;
  }
}

export const graphWindowController = new GraphWindowController();
