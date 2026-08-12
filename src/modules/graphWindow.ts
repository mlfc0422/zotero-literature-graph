import type cytoscape from "cytoscape";
import type { GraphData, GraphNode } from "./graphData";
import { buildCurrentCollectionGraph, GraphDataError } from "./graphData";
import { isWindowAlive } from "../utils/window";
import {
  getForceBalanceLabel,
  getForceBalanceProfile,
} from "../features/graph/forceProfile";
import { startGraphPhysics } from "../features/graph/physics";
import { GRAPH_WINDOW_STYLES } from "../features/graph/styles";
import { createCytoscapeStyles } from "../features/graph/cytoscapeStyles";
import { installBrowserGlobals } from "../platform/browserGlobals";
import { focusAndSelectItem, getMainWindow } from "../platform/zoteroWindows";

let createCytoscape: typeof cytoscape | undefined;

async function getCytoscape(win: Window): Promise<typeof cytoscape> {
  installBrowserGlobals(win);
  if (!createCytoscape) {
    createCytoscape = (await import("cytoscape")).default;
  }
  return createCytoscape;
}

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
  private stopPhysics?: () => void;
  private cleanups: Array<() => void> = [];
  private data?: GraphData;

  openOrRefresh(sourceWin?: _ZoteroTypes.MainWindow): void {
    const activeSourceWin = sourceWin ?? getMainWindow();
    if (isWindowAlive(this.window)) {
      this.window!.focus();
      void this.refresh(activeSourceWin);
      return;
    }

    const dialogData: Record<string, unknown> = {
      loadCallback: () => {
        this.window = dialog.window;
        try {
          this.buildShell(dialog.window.document);
          void this.refresh(activeSourceWin);
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
          styles: { width: "1200px", height: "800px" },
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

  async refresh(sourceWin?: _ZoteroTypes.MainWindow): Promise<void> {
    if (!isWindowAlive(this.window)) return;
    try {
      this.data = buildCurrentCollectionGraph(sourceWin ?? getMainWindow());
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
        text: GRAPH_WINDOW_STYLES,
      });
    }
    const resizeShell = () => {
      const win = this.window;
      if (!win) return;
      const width = Math.max(320, win.innerWidth);
      const height = Math.max(240, win.innerHeight);
      (host as HTMLElement).style.width = `${width}px`;
      (host as HTMLElement).style.height = `${height}px`;
      const app = doc.getElementById("app") as HTMLElement | null;
      if (app) {
        app.style.width = `${width}px`;
        app.style.height = `${height}px`;
      }
      this.cy?.resize().fit(undefined, 48);
    };
    this.window?.addEventListener("resize", resizeShell);
    this.cleanups.push(() =>
      this.window?.removeEventListener("resize", resizeShell),
    );
    host.replaceChildren();
    const app = append(doc, host, "div", { id: "app" });
    resizeShell();
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
    threshold.min = "1";
    threshold.value = "1";
    append(doc, thresholdLabel, "span", {
      id: "threshold-value",
      text: threshold.value,
    });
    const distanceLabel = append(doc, header, "label", { text: "力平衡" });
    const distance = append(doc, distanceLabel, "input", { id: "distance" });
    distance.type = "range";
    distance.min = "0";
    distance.max = "200";
    distance.step = "5";
    distance.value = "100";
    append(doc, distanceLabel, "span", {
      id: "distance-value",
      text: getForceBalanceLabel(Number(distance.value)),
    });
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
    const distanceHandler = () => {
      (doc.getElementById("distance-value") as HTMLElement).textContent =
        getForceBalanceProfile(Number(distance.value)).label;
      void this.render(this.data);
    };
    search.addEventListener("input", searchHandler);
    threshold.addEventListener("input", thresholdHandler);
    distance.addEventListener("input", distanceHandler);
    this.cleanups.push(
      () => search.removeEventListener("input", searchHandler),
      () => threshold.removeEventListener("input", thresholdHandler),
      () => distance.removeEventListener("input", distanceHandler),
    );
  }

  private async render(data?: GraphData): Promise<void> {
    const doc = this.window?.document;
    if (!doc || !data) return;
    this.stopPhysics?.();
    this.stopPhysics = undefined;
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
    const sortedCounts = nodes
      .map((node) => node.count)
      .sort((left, right) => right - left);
    const topTenPercent =
      sortedCounts[Math.max(0, Math.ceil(sortedCounts.length * 0.1) - 1)] ?? 3;
    const coreThreshold = Math.max(3, topTenPercent);
    const visualNodes = nodes.map((node) => ({
      ...node,
      size: Math.min(54, 22 + Math.sqrt(Math.max(0, node.count - 1)) * 8),
      isCore: node.count >= coreThreshold,
    }));
    if (!edges.length) return this.showEmpty("当前权重阈值下没有可显示的关系");
    this.hideEmpty();
    const forceProfile = getForceBalanceProfile(
      Number((doc.getElementById("distance") as HTMLInputElement).value),
    );
    (doc.getElementById("heading") as HTMLElement).textContent =
      `${data.collection.name} · 作者—标签关系网`;
    (doc.getElementById("summary") as HTMLElement).textContent =
      `${Object.keys(data.papers).length} 篇论文 · ${nodes.length} 个节点 · ${edges.length} 条关系`;
    const container = doc.getElementById("canvas") as HTMLElement;
    // Cytoscape captures browser globals when it is first loaded. Use the
    // persistent Zotero main window rather than this closeable dialog window.
    const cytoscapeFactory = await getCytoscape(getMainWindow());
    this.cy = cytoscapeFactory({
      container,
      elements: [
        ...visualNodes.map((node) => ({
          data: { ...node },
          classes: `${node.type}${node.isCore ? " core" : ""}`,
        })),
        ...edges.map((edge) => ({ data: { ...edge } })),
      ],
      style: createCytoscapeStyles(),
      layout: {
        name: "cose",
        animate: false,
        fit: true,
        padding: 72,
        nodeRepulsion: () => 10000 * forceProfile.repulsionScale,
        idealEdgeLength: (edge) =>
          Math.max(
            24,
            (80 - Number(edge.data("weight")) * 8) * forceProfile.distanceScale,
          ),
        gravity: 0.04 * forceProfile.attractionScale,
        gravityRange: 3.5 * forceProfile.attractionScale,
        componentSpacing: Math.max(35, 100 * forceProfile.distanceScale),
        nodeOverlap: Math.max(6, 14 * forceProfile.distanceScale),
        numIter: 1600,
      } as cytoscape.LayoutOptions,
      wheelSensitivity: 0.18,
      minZoom: 0.15,
      maxZoom: 5,
    });
    this.cy.on("tap", "node", (event) => {
      const node = data.nodes.find((entry) => entry.id === event.target.id());
      if (node) this.selectNode(node);
    });
    this.cy.on("tap", (event) => {
      if (event.target === this.cy) this.clearSelection();
    });
    this.cy.on("dbltap", (event) => {
      if (event.target === this.cy) void this.refresh();
    });
    this.cy.on("mouseover", "node", (event) => event.target.addClass("match"));
    this.cy.on("mouseout", "node", (event) =>
      event.target.removeClass("match"),
    );
    const renderedCy = this.cy;
    this.stopPhysics = await startGraphPhysics(
      renderedCy,
      forceProfile,
      () => this.cy === renderedCy,
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
    this.cy.nodes().removeClass("label-visible");
    neighborhood.nodes().addClass("label-visible");
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

  private clearSelection(): void {
    if (!this.cy || !this.window) return;
    this.cy.elements().removeClass("dimmed selected active");
    this.cy.nodes().removeClass("label-visible");
    const doc = this.window.document;
    const search = doc.getElementById("search") as HTMLInputElement;
    this.applySearch(search.value);
    (doc.getElementById("detail-title") as HTMLElement).textContent =
      "关联论文";
    (doc.getElementById("papers") as HTMLUListElement).replaceChildren();
  }

  private locatePaper(id: number): void {
    focusAndSelectItem(id);
  }

  private showEmpty(message: string): void {
    this.stopPhysics?.();
    this.stopPhysics = undefined;
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
    this.stopPhysics?.();
    this.stopPhysics = undefined;
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
