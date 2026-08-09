import * as d3 from "d3";
import type { GraphData, GraphEdge, GraphNode } from "./graphData";
import { buildCurrentCollectionGraph, GraphDataError } from "./graphData";
import { isWindowAlive } from "../utils/window";

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}
interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  paperIds: number[];
  weight: number;
}

const STYLES = `
  :root { color-scheme: light dark; font: 14px system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; height: 100vh; overflow: hidden; background: #f7f8fa; color: #202124; }
  #app { height: 100%; display: grid; grid-template-rows: auto 1fr; }
  header { display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: #fff; border-bottom: 1px solid #dfe1e5; }
  h1 { margin: 0 auto 0 0; font-size: 17px; white-space: nowrap; }
  label { display: flex; gap: 7px; align-items: center; white-space: nowrap; }
  input[type=search] { width: 220px; padding: 7px 10px; border: 1px solid #c8ccd1; border-radius: 6px; }
  main { min-height: 0; display: grid; grid-template-columns: 1fr 310px; }
  #canvas { position: relative; min-width: 0; background: radial-gradient(circle at center, #fff, #f4f6f8); }
  svg { display: block; width: 100%; height: 100%; cursor: grab; user-select: none; }
  svg.is-panning { cursor: grabbing; }
  aside { overflow: auto; background: #fff; border-left: 1px solid #dfe1e5; padding: 16px; }
  #summary { color: #62676d; margin-bottom: 14px; }
  #detail-title { margin: 0 0 10px; font-size: 16px; }
  #papers { list-style: none; padding: 0; margin: 0; }
  #papers li { padding: 9px 7px; border-bottom: 1px solid #eceff1; cursor: default; border-radius: 5px; }
  #papers li:hover { background: #edf4ff; }
  .paper-title { font-weight: 600; }
  .paper-meta { color: #73777c; font-size: 12px; margin-top: 3px; }
  .link { stroke: #aeb7c2; stroke-opacity: .48; }
  .link.active { stroke: #e67e22; stroke-opacity: 1; }
  .node { cursor: pointer; stroke: #fff; stroke-width: 1.5px; }
  .node.dimmed, .link.dimmed { opacity: .09; }
  .node.active { stroke: #202124; stroke-width: 3px; }
  .label { pointer-events: none; font-size: 11px; fill: #30343a; paint-order: stroke; stroke: #fff; stroke-width: 3px; stroke-linejoin: round; }
  #empty { position: absolute; inset: 0; display: none; place-items: center; color: #62676d; font-size: 16px; text-align: center; padding: 30px; }
  @media (prefers-color-scheme: dark) {
    body, #canvas { background: #202124; color: #e8eaed; }
    header, aside { background: #292a2d; border-color: #44464b; }
    #canvas { background: radial-gradient(circle at center, #292a2d, #202124); }
    input[type=search] { color: #e8eaed; background: #202124; border-color: #5f6368; }
    .label { fill: #e8eaed; stroke: #202124; }
    .node { stroke: #202124; }
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
  private simulation?: d3.Simulation<SimNode, SimEdge>;
  private resizeObserver?: ResizeObserver;
  private cleanups: Array<() => void> = [];
  private data?: GraphData;

  openOrRefresh(
    sourceWin: _ZoteroTypes.MainWindow = Zotero.getMainWindow(),
  ): void {
    if (isWindowAlive(this.window)) {
      this.window!.focus();
      this.refresh(sourceWin);
      return;
    }

    const dialogData: Record<string, unknown> = {
      loadCallback: () => {
        this.window = dialog.window;
        try {
          this.buildShell(dialog.window.document);
          this.refresh(sourceWin);
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

  refresh(sourceWin: _ZoteroTypes.MainWindow = Zotero.getMainWindow()): void {
    if (!isWindowAlive(this.window)) return;
    let data: GraphData;
    try {
      data = buildCurrentCollectionGraph(sourceWin);
    } catch (error) {
      const message =
        error instanceof GraphDataError
          ? error.message
          : "读取当前分类时发生错误，请稍后重试";
      ztoolkit.log("Failed to build author-tag graph", error);
      this.showEmpty(message);
      return;
    }

    this.data = data;
    try {
      this.render(data);
    } catch (error) {
      ztoolkit.log("Failed to render author-tag graph", error);
      const detail = error instanceof Error ? `：${error.message}` : "";
      this.showEmpty(`图谱渲染失败${detail}`);
    }
  }

  close(): void {
    if (isWindowAlive(this.window)) this.window!.close();
    this.disposeWindow();
  }

  private buildShell(doc: Document): void {
    const head = doc.head!;
    const host = doc.getElementById("zotero-puls-graph-root");
    if (!host) throw new Error("图谱窗口容器未创建");
    if (!doc.getElementById("zotero-puls-graph-style")) {
      append(doc, head, "style", {
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
    search.setAttribute("aria-label", "搜索作者或标签");

    const thresholdLabel = append(doc, header, "label", {
      text: "最小关系权重",
    });
    const threshold = append(doc, thresholdLabel, "input", { id: "threshold" });
    threshold.type = "range";
    threshold.min = "1";
    threshold.value = "1";
    const thresholdValue = append(doc, thresholdLabel, "span", {
      id: "threshold-value",
      text: "1",
    });

    const main = append(doc, app, "main");
    const canvas = append(doc, main, "section", { id: "canvas" });
    canvas.setAttribute("aria-label", "关系网画布");
    append(doc, canvas, "div", { id: "empty" });
    const aside = append(doc, main, "aside");
    append(doc, aside, "div", { id: "summary", text: "点击节点查看关联论文" });
    append(doc, aside, "h2", { id: "detail-title", text: "关联论文" });
    append(doc, aside, "ul", { id: "papers" });

    const searchHandler = () => this.applyHighlight(search.value);
    const thresholdHandler = () => {
      thresholdValue.textContent = threshold.value;
      this.render(this.data);
    };
    search.addEventListener("input", searchHandler);
    threshold.addEventListener("input", thresholdHandler);
    this.cleanups.push(
      () => search.removeEventListener("input", searchHandler),
      () => threshold.removeEventListener("input", thresholdHandler),
    );
  }

  private render(data?: GraphData): void {
    const doc = this.window?.document;
    if (!doc || !data) return;
    this.simulation?.stop();
    this.resizeObserver?.disconnect();
    doc.querySelector("#canvas svg")?.remove();

    const slider = doc.getElementById("threshold") as HTMLInputElement;
    const maxWeight = Math.max(1, ...data.edges.map((edge) => edge.weight));
    slider.max = String(maxWeight);
    if (Number(slider.value) > maxWeight) slider.value = String(maxWeight);
    (doc.getElementById("threshold-value") as HTMLElement).textContent =
      slider.value;
    const threshold = Number(slider.value);
    const edges = data.edges.filter((edge) => edge.weight >= threshold);
    const nodeIds = new Set(
      edges.flatMap((edge) => [edge.source, edge.target]),
    );
    const nodes: SimNode[] = data.nodes
      .filter((node) => nodeIds.has(node.id))
      .map((node) => ({ ...node }));
    const links: SimEdge[] = edges.map((edge) => ({ ...edge }));
    if (!edges.length) {
      this.showEmpty("当前权重阈值下没有可显示的关系");
      return;
    }
    this.hideEmpty();
    (doc.getElementById("heading") as HTMLElement).textContent =
      `${data.collection.name} · 作者—标签关系网`;
    (doc.getElementById("summary") as HTMLElement).textContent =
      `${Object.keys(data.papers).length} 篇论文 · ${nodes.length} 个节点 · ${edges.length} 条关系`;

    const canvas = doc.getElementById("canvas") as HTMLElement;
    const width = Math.max(400, canvas.clientWidth);
    const height = Math.max(300, canvas.clientHeight);
    const svg = d3
      .select(canvas)
      .insert<any>("svg", "#empty")
      .attr("viewBox", [0, 0, width, height]);
    const viewport = svg.append("g");
    this.registerCanvasNavigation(svg, viewport);

    const link = viewport
      .append("g")
      .selectAll<any, SimEdge>("line")
      .data(links)
      .join("line")
      .attr("class", "link")
      .attr("data-id", (edge) => edge.id)
      .attr("stroke-width", (edge) => 1 + Math.sqrt(edge.weight) * 1.4);

    const nodeGroup = viewport
      .append("g")
      .selectAll<any, SimNode>("g")
      .data(nodes)
      .join("g")
      .attr("data-id", (node) => node.id)
      .on("click", (_event, node) => this.selectNode(node));

    nodeGroup
      .filter((node) => node.type === "author")
      .append("circle")
      .attr("class", "node")
      .attr("r", (node) => 6 + Math.sqrt(node.count) * 2.4)
      .attr("fill", "#4b8bea");
    nodeGroup
      .filter((node) => node.type === "tag")
      .append("rect")
      .attr("class", "node")
      .attr("x", (node) => -(6 + Math.sqrt(node.count) * 2.2))
      .attr("y", (node) => -(6 + Math.sqrt(node.count) * 2.2))
      .attr("width", (node) => (6 + Math.sqrt(node.count) * 2.2) * 2)
      .attr("height", (node) => (6 + Math.sqrt(node.count) * 2.2) * 2)
      .attr("rx", 3)
      .attr("fill", "#31a36b");
    nodeGroup
      .append("title")
      .text(
        (node) =>
          `${node.type === "author" ? "作者" : "标签"}：${node.label}\n${node.count} 篇论文`,
      );
    nodeGroup
      .append("text")
      .attr("class", "label")
      .attr("x", 12)
      .attr("y", 4)
      .text((node) => node.label);

    this.simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimEdge>(links)
          .id((node) => node.id)
          .distance((edge) => Math.max(55, 125 - edge.weight * 5))
          .strength(0.45),
      )
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3
          .forceCollide<SimNode>()
          .radius((node) => 18 + Math.sqrt(node.count) * 2),
      )
      .on("tick", () => {
        link
          .attr("x1", (edge) => (edge.source as SimNode).x ?? 0)
          .attr("y1", (edge) => (edge.source as SimNode).y ?? 0)
          .attr("x2", (edge) => (edge.target as SimNode).x ?? 0)
          .attr("y2", (edge) => (edge.target as SimNode).y ?? 0);
        nodeGroup.attr(
          "transform",
          (node) => `translate(${node.x ?? 0},${node.y ?? 0})`,
        );
      });

    nodeGroup.call(
      d3
        .drag<any, SimNode>()
        .touchable(false)
        .filter((event) => event.type === "mousedown")
        .on("start", (event, node) => {
          if (!event.active) this.simulation?.alphaTarget(0.3).restart();
          node.fx = node.x;
          node.fy = node.y;
        })
        .on("drag", (event, node) => {
          node.fx = event.x;
          node.fy = event.y;
        })
        .on("end", (event, node) => {
          if (!event.active) this.simulation?.alphaTarget(0);
          node.fx = null;
          node.fy = null;
        }),
    );

    const ResizeObserverClass = this.window?.ResizeObserver;
    if (ResizeObserverClass) {
      const resizeObserver = new ResizeObserverClass(() => {
        const nextWidth = Math.max(400, canvas.clientWidth);
        const nextHeight = Math.max(300, canvas.clientHeight);
        svg.attr("viewBox", [0, 0, nextWidth, nextHeight]);
        this.simulation
          ?.force("center", d3.forceCenter(nextWidth / 2, nextHeight / 2))
          .alpha(0.25)
          .restart();
      });
      this.resizeObserver = resizeObserver;
      resizeObserver.observe(canvas);
    }
    const query = (doc.getElementById("search") as HTMLInputElement).value;
    if (query) this.applyHighlight(query);
  }

  private registerCanvasNavigation(
    svg: d3.Selection<any, unknown, null, undefined>,
    viewport: d3.Selection<any, unknown, null, undefined>,
  ): void {
    let transform = d3.zoomIdentity;
    let panning = false;
    let previousPoint: [number, number] | undefined;
    const svgNode = svg.node() as SVGSVGElement;
    const update = () => viewport.attr("transform", transform.toString());

    svg
      .on("wheel.graph-navigation", (event: WheelEvent) => {
        event.preventDefault();
        const [x, y] = d3.pointer(event, svgNode);
        const factor = Math.pow(2, -event.deltaY * 0.002);
        const scale = Math.max(0.15, Math.min(5, transform.k * factor));
        transform = transform
          .translate(x, y)
          .scale(scale / transform.k)
          .translate(-x, -y);
        update();
      })
      .on("mousedown.graph-navigation", (event: MouseEvent) => {
        const target = event.target as {
          closest?: (selector: string) => Element | null;
        };
        if (event.button !== 0 || target.closest?.(".node")) return;
        panning = true;
        previousPoint = d3.pointer(event, svgNode);
        svg.classed("is-panning", true);
        event.preventDefault();
      })
      .on("mousemove.graph-navigation", (event: MouseEvent) => {
        if (!panning || !previousPoint) return;
        const point = d3.pointer(event, svgNode);
        transform = transform.translate(
          (point[0] - previousPoint[0]) / transform.k,
          (point[1] - previousPoint[1]) / transform.k,
        );
        previousPoint = point;
        update();
      })
      .on("mouseup.graph-navigation mouseleave.graph-navigation", () => {
        panning = false;
        previousPoint = undefined;
        svg.classed("is-panning", false);
      });
  }

  private applyHighlight(query: string): void {
    const doc = this.window?.document;
    if (!doc) return;
    const normalized = query.trim().toLocaleLowerCase();
    const groups = doc.querySelectorAll("g[data-id]");
    groups.forEach((element: Element) => {
      const group = element as unknown as SVGGElement;
      const node = this.data?.nodes.find(
        (entry) => entry.id === group.dataset.id,
      );
      group
        .querySelector(".node")
        ?.classList.toggle(
          "dimmed",
          Boolean(
            normalized &&
            node &&
            !node.label.toLocaleLowerCase().includes(normalized),
          ),
        );
    });
  }

  private selectNode(node: GraphNode): void {
    const doc = this.window?.document;
    if (!doc || !this.data) return;
    const adjacentEdges = this.data.edges.filter(
      (edge) => edge.source === node.id || edge.target === node.id,
    );
    const adjacentNodeIds = new Set([
      node.id,
      ...adjacentEdges.flatMap((edge) => [edge.source, edge.target]),
    ]);
    doc.querySelectorAll("g[data-id]").forEach((element: Element) => {
      const group = element as unknown as SVGGElement;
      const shape = group.querySelector(".node");
      shape?.classList.toggle("active", group.dataset.id === node.id);
      shape?.classList.toggle(
        "dimmed",
        !adjacentNodeIds.has(group.dataset.id || ""),
      );
    });
    doc.querySelectorAll("line[data-id]").forEach((element: Element) => {
      const line = element as unknown as SVGLineElement;
      const active = adjacentEdges.some((edge) => edge.id === line.dataset.id);
      line.classList.toggle("active", active);
      line.classList.toggle("dimmed", !active);
    });
    this.renderPaperList(node);
  }

  private renderPaperList(node: GraphNode): void {
    const doc = this.window?.document;
    if (!doc || !this.data) return;
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
    const doc = this.window?.document;
    if (!doc) return;
    this.simulation?.stop();
    doc.querySelector("#canvas svg")?.remove();
    const empty = doc.getElementById("empty") as HTMLElement;
    empty.textContent = message;
    empty.style.display = "grid";
    (doc.getElementById("summary") as HTMLElement).textContent = message;
    (doc.getElementById("papers") as HTMLElement).replaceChildren();
  }

  private showFatalError(error: unknown): void {
    const doc = this.window?.document;
    if (!doc) return;
    const host = doc.getElementById("zotero-puls-graph-root") || doc.body;
    if (!host) return;
    host.replaceChildren();
    const title = doc.createElement("h1");
    title.textContent = "关系网窗口未能初始化";
    const detail = doc.createElement("p");
    detail.textContent =
      error instanceof Error
        ? error.message
        : "发生了未知错误，请查看 Zotero 错误控制台。";
    host.append(title, detail);
  }

  private hideEmpty(): void {
    const empty = this.window?.document.getElementById("empty") as
      HTMLElement | undefined;
    if (empty) empty.style.display = "none";
  }

  private disposeWindow(): void {
    this.simulation?.stop();
    this.simulation = undefined;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.window = undefined;
    this.data = undefined;
  }
}

export const graphWindowController = new GraphWindowController();
