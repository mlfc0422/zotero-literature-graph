import type cytoscape from "cytoscape";
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import type { ForceBalanceProfile } from "./forceProfile";

interface PhysicsNode extends SimulationNodeDatum {
  id: string;
  radius: number;
}

interface PhysicsLink extends SimulationLinkDatum<PhysicsNode> {
  weight: number;
}

let d3Force: typeof import("d3-force") | undefined;

async function getD3Force(): Promise<typeof import("d3-force")> {
  d3Force ??= await import("d3-force");
  return d3Force;
}

export async function startGraphPhysics(
  cy: cytoscape.Core,
  profile: ForceBalanceProfile,
  isCurrent: () => boolean,
): Promise<() => void> {
  const d3 = await getD3Force();
  if (!isCurrent()) return () => undefined;

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
        if (componentByNode.has(neighbour)) continue;
        componentByNode.set(neighbour, componentCount);
        queue.push(neighbour);
      }
    }
    componentCount += 1;
  }

  const columns = Math.ceil(Math.sqrt(componentCount));
  const rows = Math.ceil(componentCount / columns);
  const componentGapX = Math.min(
    180 * profile.distanceScale,
    Math.max(
      120 * profile.distanceScale,
      (cy.width() - 180) / Math.max(1, columns - 1),
    ),
  );
  const componentGapY = Math.min(
    155 * profile.distanceScale,
    Math.max(
      105 * profile.distanceScale,
      (cy.height() - 160) / Math.max(1, rows - 1),
    ),
  );
  const componentTargets = Array.from(
    { length: componentCount },
    (_, index) => ({
      x:
        cy.width() / 2 +
        ((index % columns) - (columns - 1) / 2) * componentGapX,
      y:
        cy.height() / 2 +
        (Math.floor(index / columns) - (rows - 1) / 2) * componentGapY,
    }),
  );

  const simulation = d3
    .forceSimulation(physicsNodes)
    .force(
      "link",
      d3
        .forceLink<PhysicsNode, PhysicsLink>(physicsLinks)
        .id((node) => node.id)
        .distance((link) =>
          Math.max(24, (72 - link.weight * 6.5) * profile.distanceScale),
        )
        .strength(profile.linkStrength),
    )
    .force("charge", d3.forceManyBody().strength(-300 * profile.repulsionScale))
    .force(
      "collide",
      d3
        .forceCollide<PhysicsNode>()
        .radius((node) => node.radius + 6 * profile.distanceScale),
    )
    .force(
      "component-x",
      d3
        .forceX<PhysicsNode>(
          (node) => componentTargets[componentByNode.get(node.id) ?? 0].x,
        )
        .strength(0.038 * profile.attractionScale),
    )
    .force(
      "component-y",
      d3
        .forceY<PhysicsNode>(
          (node) => componentTargets[componentByNode.get(node.id) ?? 0].y,
        )
        .strength(0.038 * profile.attractionScale),
    )
    .velocityDecay(0.46)
    .alphaDecay(0.035)
    .alphaTarget(0.012)
    .on("tick", () => {
      if (!isCurrent()) return;
      cy.batch(() => {
        for (const node of cy.nodes()) {
          const physicsNode = nodeById.get(node.id());
          if (!physicsNode || node.grabbed()) continue;
          if (Number.isFinite(physicsNode.x) && Number.isFinite(physicsNode.y))
            node.position({ x: physicsNode.x!, y: physicsNode.y! });
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

  return () => {
    simulation.stop();
    cy.off("grab", "node", pinNode);
    cy.off("drag", "node", pinNode);
    cy.off("dragfree", "node", settle);
  };
}
