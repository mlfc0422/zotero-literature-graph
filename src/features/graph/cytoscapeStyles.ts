import type cytoscape from "cytoscape";

export function createCytoscapeStyles(): cytoscape.StylesheetJson {
  return [
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
  ];
}
