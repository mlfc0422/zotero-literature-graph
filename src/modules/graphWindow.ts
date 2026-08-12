import type cytoscape from "cytoscape";
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import type { GraphData, GraphNode } from "./graphData";
import { buildCurrentCollectionGraph, GraphDataError } from "./graphData";
import { isWindowAlive } from "../utils/window";

let createCytoscape: typeof cytoscape | undefined;
let d3Force: typeof import("d3-force") | undefined;

interface PhysicsNode extends SimulationNodeDatum {
  id: string;
  radius: number;
}

interface PhysicsLink extends SimulationLinkDatum<PhysicsNode> {
  weight: number;
}

interface ForceBalanceProfile {
  value: number;
  label: string;
  distanceScale: number;
  repulsionScale: number;
  attractionScale: number;
  linkStrength: number;
}

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

async function getD3Force(): Promise<typeof import("d3-force")> {
  d3Force ??= await import("d3-force");
  return d3Force;
}

const STYLES = `
  :root { color-scheme: light dark; font: 14px system-ui, sans-serif; }
  * { box-sizing: border-box; }
  body { margin: 0; overflow: hidden; background: #f7f8fa; color: #202124; }
  #app { height: 100%; min-height: 0; display: grid; grid-template-rows: auto 1fr; }
  header { display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: rgba(255,255,255,.94); border-bottom: 1px solid #dfe1e5; }
  h1 { margin: 0 auto 0 0; font-size: 17px; white-space: nowrap; }
  label { display: flex; gap: 8px; align-items: center; white-space: nowrap; color: #5d6875; font-size: 12px; font-weight: 600; }
  input[type=search] { width: 220px; padding: 7px 10px; border: 1px solid #c8ccd1; border-radius: 6px; }
  input[type=range] { width: 128px; height: 18px; margin: 0; accent-color: #475569; cursor: pointer; appearance: none; background: transparent; }
  input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 999px; background: linear-gradient(90deg, #cbd5e1, #64748b); box-shadow: inset 0 0 0 1px rgba(71,85,105,.14); }
  input[type=range]::-webkit-slider-thumb { width: 15px; height: 15px; margin-top: -5.5px; border: 3px solid #fff; border-radius: 50%; background: #334155; box-shadow: 0 1px 4px rgba(15,23,42,.3); appearance: none; transition: transform .15s ease, box-shadow .15s ease; }
  input[type=range]:hover::-webkit-slider-thumb, input[type=range]:focus-visible::-webkit-slider-thumb { transform: scale(1.16); box-shadow: 0 0 0 4px rgba(100,116,139,.18), 0 1px 5px rgba(15,23,42,.35); }
  input[type=range]::-moz-range-track { height: 4px; border-radius: 999px; background: #94a3b8; }
  input[type=range]::-moz-range-thumb { width: 11px; height: 11px; border: 3px solid #fff; border-radius: 50%; background: #334155; box-shadow: 0 1px 4px rgba(15,23,42,.3); }
  header label span { min-width: 58px; color: #334155; font-variant-numeric: tabular-nums; }
  main { min-height: 0; display: grid; grid-template-columns: 1fr 310px; }
  #canvas { min-width: 0; min-height: 0; background: radial-gradient(circle at center, #ffffff, #f1f3f5); }
  aside { overflow: auto; background: #fff; border-left: 1px solid #dfe1e5; padding: 16px; }
  #summary { color: #5d6875; margin-bottom: 12px; font-weight: 600; }
  #legend { display: flex; gap: 12px; margin-bottom: 14px; color: #5d6875; font-size: 12px; }
  .legend-item { display: flex; align-items: center; gap: 5px; }
  .legend-dot { width: 10px; height: 10px; display: inline-block; border-radius: 50%; }
  .legend-dot.author { background: #d1d5db; border: 1px solid #9ca3af; }
  .legend-dot.tag { background: #374151; }
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
    header, aside { background: rgba(41,42,45,.96); border-color: #44464b; }
    #canvas { background: radial-gradient(circle at center, #292a2d, #202124); }
    input[type=search] { color: #e8eaed; background: #202124; border-color: #5f6368; }
    label, header label span { color: #cbd5e1; }
    input[type=range]::-webkit-slider-runnable-track { background: linear-gradient(90deg, #475569, #cbd5e1); }
    input[type=range]::-webkit-slider-thumb, input[type=range]::-moz-range-thumb { border-color: #292a2d; background: #e2e8f0; }
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
  private stopPhysics?: () => void;
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
    const maximize = append(doc, header, "button", {
      id: "maximize",
      text: "最大化",
    });
    maximize.type = "button";
    const toggleMaximize = () => {
      const win = this.window;
      if (!win) return;
      if (win.windowState === win.STATE_MAXIMIZED) {
        win.restore();
        maximize.textContent = "最大化";
      } else {
        win.maximize();
        maximize.textContent = "还原";
      }
    };
    maximize.addEventListener("click", toggleMaximize);
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
      text: this.getForceBalanceLabel(Number(distance.value)),
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
        this.getForceBalanceProfile().label;
      void this.render(this.data);
    };
    search.addEventListener("input", searchHandler);
    threshold.addEventListener("input", thresholdHandler);
    distance.addEventListener("input", distanceHandler);
    this.cleanups.push(
      () => search.removeEventListener("input", searchHandler),
      () => threshold.removeEventListener("input", thresholdHandler),
      () => distance.removeEventListener("input", distanceHandler),
      () => maximize.removeEventListener("click", toggleMaximize),
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
    const forceProfile = this.getForceBalanceProfile();
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
        ...visualNodes.map((node) => ({
          data: { ...node },
          classes: `${node.type}${node.isCore ? " core" : ""}`,
        })),
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
            shape: "ellipse",
            width: "data(size)",
            height: "data(size)",
            "border-width": 2,
            "border-color": "#ffffff",
          },
        },
        {
          selector: "node.author",
          style: { "background-color": "#d1d5db", "border-color": "#9ca3af" },
        },
        {
          selector: "node.tag",
          style: {
            "background-color": "#374151",
            "border-color": "#1f2937",
            "text-opacity": 1,
          },
        },
        {
          selector: "node.core",
          style: {
            "text-opacity": 1,
            "font-size": 12,
            "border-width": 4,
            "border-color": "#475569",
          },
        },
        { selector: "node.label-visible", style: { "text-opacity": 1 } },
        {
          selector: "edge",
          style: {
            width: "mapData(weight, 1, 8, 1, 5)",
            "line-color": "#94a3b8",
            "curve-style": "bezier",
            opacity: (edge: cytoscape.EdgeSingular) =>
              Math.min(0.68, 0.1 + (Number(edge.data("weight")) - 1) * 0.08),
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
          style: { "line-color": "#334155", opacity: 0.95 },
        },
      ],
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
    await this.startPhysics(forceProfile);
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

  private getForceBalanceProfile(): ForceBalanceProfile {
    const rawValue = Number(
      (this.window?.document.getElementById("distance") as HTMLInputElement)
        ?.value,
    );
    const value = Math.max(
      0,
      Math.min(200, Number.isFinite(rawValue) ? rawValue : 100),
    );
    const compactness = (value - 100) / 100;
    return {
      value,
      label: `${value} · ${value < 85 ? "松散" : value > 115 ? "紧密" : "均衡"}`,
      distanceScale: 1 - compactness * 0.35,
      repulsionScale: 1 - compactness * 0.65,
      attractionScale: 1 + compactness * 0.7,
      linkStrength: Math.max(0.3, Math.min(1, 0.7 + compactness * 0.4)),
    };
  }

  private getForceBalanceLabel(value: number): string {
    return `${value} · ${value < 85 ? "松散" : value > 115 ? "紧密" : "均衡"}`;
  }

  private async startPhysics(forceProfile: ForceBalanceProfile): Promise<void> {
    const cy = this.cy;
    if (!cy) return;
    const d3 = await getD3Force();
    if (cy !== this.cy) return;

    const physicsNodes: PhysicsNode[] = cy.nodes().map((node) => ({
      id: node.id(),
      x: node.position("x"),
      y: node.position("y"),
      radius: Number(node.data("size")) / 2,
    }));
    const nodeById = new Map(physicsNodes.map((node) => [node.id, node]));
    const physicsLinks: PhysicsLink[] = cy.edges().map((edge) => ({
      source: edge.source().id(),
      target: edge.target().id(),
      weight: Number(edge.data("weight")),
    }));
    const neighbours = new Map(
      physicsNodes.map((node) => [node.id, new Set<string>()]),
    );
    for (const link of physicsLinks) {
      const source = String(link.source);
      const target = String(link.target);
      neighbours.get(source)?.add(target);
      neighbours.get(target)?.add(source);
    }
    const componentByNode = new Map<string, number>();
    let componentCount = 0;
    for (const node of physicsNodes) {
      if (componentByNode.has(node.id)) continue;
      const queue = [node.id];
      componentByNode.set(node.id, componentCount);
      for (const id of queue) {
        for (const neighbour of neighbours.get(id) ?? []) {
          if (!componentByNode.has(neighbour)) {
            componentByNode.set(neighbour, componentCount);
            queue.push(neighbour);
          }
        }
      }
      componentCount += 1;
    }
    const columns = Math.ceil(Math.sqrt(componentCount));
    const rows = Math.ceil(componentCount / columns);
    const componentGapX = Math.min(
      180 * forceProfile.distanceScale,
      Math.max(
        120 * forceProfile.distanceScale,
        (cy.width() - 180) / Math.max(1, columns - 1),
      ),
    );
    const componentGapY = Math.min(
      155 * forceProfile.distanceScale,
      Math.max(
        105 * forceProfile.distanceScale,
        (cy.height() - 160) / Math.max(1, rows - 1),
      ),
    );
    const componentTargets = Array.from(
      { length: componentCount },
      (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        return {
          x: cy.width() / 2 + (column - (columns - 1) / 2) * componentGapX,
          y: cy.height() / 2 + (row - (rows - 1) / 2) * componentGapY,
        };
      },
    );
    const simulation = d3
      .forceSimulation(physicsNodes)
      .force(
        "link",
        d3
          .forceLink<PhysicsNode, PhysicsLink>(physicsLinks)
          .id((node) => node.id)
          .distance((link) =>
            Math.max(24, (72 - link.weight * 6.5) * forceProfile.distanceScale),
          )
          .strength(forceProfile.linkStrength),
      )
      .force(
        "charge",
        d3.forceManyBody().strength(-300 * forceProfile.repulsionScale),
      )
      .force(
        "collide",
        d3
          .forceCollide<PhysicsNode>()
          .radius((node) => node.radius + 6 * forceProfile.distanceScale),
      )
      .force(
        "component-x",
        d3
          .forceX<PhysicsNode>(
            (node) => componentTargets[componentByNode.get(node.id) ?? 0].x,
          )
          .strength(0.038 * forceProfile.attractionScale),
      )
      .force(
        "component-y",
        d3
          .forceY<PhysicsNode>(
            (node) => componentTargets[componentByNode.get(node.id) ?? 0].y,
          )
          .strength(0.038 * forceProfile.attractionScale),
      )
      .velocityDecay(0.46)
      .alphaDecay(0.035)
      .alphaTarget(0.012)
      .on("tick", () => {
        if (cy !== this.cy) return;
        cy.batch(() => {
          for (const node of cy.nodes()) {
            const physicsNode = nodeById.get(node.id());
            if (!physicsNode || node.grabbed()) continue;
            if (
              Number.isFinite(physicsNode.x) &&
              Number.isFinite(physicsNode.y)
            ) {
              node.position({ x: physicsNode.x!, y: physicsNode.y! });
            }
          }
        });
      });

    const pinNode = (event: cytoscape.EventObjectNode) => {
      const physicsNode = nodeById.get(event.target.id());
      if (!physicsNode) return;
      physicsNode.fx = event.target.position("x");
      physicsNode.fy = event.target.position("y");
      simulation.alphaTarget(0.28).restart();
    };
    const settle = () => simulation.alphaTarget(0.012).restart();
    cy.on("grab", "node", pinNode);
    cy.on("drag", "node", pinNode);
    cy.on("dragfree", "node", settle);
    this.stopPhysics = () => {
      simulation.stop();
      cy.off("grab", "node", pinNode);
      cy.off("drag", "node", pinNode);
      cy.off("dragfree", "node", settle);
    };
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
    const mainWin = Zotero.getMainWindow();
    mainWin.focus();
    const pane = (mainWin as unknown as { ZoteroPane: _ZoteroTypes.ZoteroPane })
      .ZoteroPane;
    void pane.selectItems([id]);
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
