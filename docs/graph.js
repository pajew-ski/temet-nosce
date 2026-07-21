import { onThemeChange } from "./theme.js";

const SHAPES = {
  Project: "ellipse",
  Concept: "ellipse",
  Component: "round-rectangle",
  Step: "round-tag",
  Limitation: "round-diamond",
};

// Cytoscape draws on a canvas and understands neither CSS custom properties
// nor oklch, so tokens are resolved to plain rgb through a one pixel canvas.
const probe = document.createElement("canvas");
probe.width = probe.height = 1;
function resolve(token) {
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

function graphStyle() {
  const bg = resolve("--bg");
  const border = resolve("--border");
  const text = resolve("--text");
  const muted = resolve("--text-muted");
  const font = getComputedStyle(document.body).fontFamily;
  return [
    {
      selector: "node",
      style: {
        shape: (n) => SHAPES[n.data("type")],
        width: 21,
        height: 21,
        "background-color": bg,
        "border-width": 1,
        "border-color": muted,
        label: (n) => n.data("label"),
        "font-family": font,
        "font-size": 8,
        color: muted,
        "text-valign": "bottom",
        "text-margin-y": 5,
        "text-wrap": "wrap",
        "text-max-width": 55,
      },
    },
    {
      selector: 'node[type = "Project"]',
      style: { width: 34, height: 34, "background-color": text, "border-color": text },
    },
    {
      selector: "node:selected",
      style: {
        "border-color": text,
        color: text,
        "underlay-color": muted,
        "underlay-opacity": 0.2,
        "underlay-padding": 5,
      },
    },
    {
      selector: "edge",
      style: {
        width: 1,
        "curve-style": "bezier",
        "line-color": border,
        "target-arrow-shape": "triangle",
        "target-arrow-color": border,
        "arrow-scale": 0.7,
      },
    },
    {
      selector: "edge.adjacent",
      style: { "line-color": muted, "target-arrow-color": muted },
    },
  ];
}

const data = await (await fetch("graph-data.json")).json();
const panel = document.querySelector("#panel");
const nodesById = new Map(data.nodes.map((n) => [n.id, n]));

const cy = cytoscape({
  container: document.querySelector("#canvas"),
  elements: [
    ...data.nodes.map((n) => ({
      data: { id: n.id, type: n.type, label: n.id.replace(/^(concept|component|step)-/, "").replaceAll("-", " ") },
    })),
    ...data.edges.map((e) => ({
      data: { id: `${e.source}~${e.rel}~${e.target}`, source: e.source, target: e.target, rel: e.rel },
    })),
  ],
  style: graphStyle(),
  layout: {
    name: "breadthfirst",
    roots: ["this-project"],
    directed: true,
    padding: 21,
    spacingFactor: 1.4,
    animate: false,
  },
  minZoom: 0.3,
  maxZoom: 3,
});

function chip(edge, direction) {
  const button = document.createElement("button");
  button.className = "edge-chip";
  const rel = document.createElement("span");
  rel.className = "rel";
  rel.textContent = direction === "out" ? `${edge.rel} → ` : `← ${edge.rel} `;
  const target = document.createElement("span");
  target.textContent = direction === "out" ? edge.target : edge.source;
  button.append(rel, target);
  button.addEventListener("click", () => select(direction === "out" ? edge.target : edge.source));
  return button;
}

function edgeList(title, edges, direction) {
  if (edges.length === 0) return [];
  const heading = document.createElement("h4");
  heading.textContent = title;
  const list = document.createElement("div");
  list.className = "flex flex-wrap gap-[var(--space-2)]";
  for (const edge of edges) list.append(chip(edge, direction));
  return [heading, list];
}

function showNode(id) {
  const node = nodesById.get(id);
  const type = document.createElement("p");
  type.className = "panel-type";
  type.textContent = node.type;
  const name = document.createElement("h3");
  name.textContent = node.id;
  const notes = document.createElement("ul");
  for (const note of node.notes) {
    const item = document.createElement("li");
    item.textContent = note;
    notes.append(item);
  }
  panel.replaceChildren(
    type,
    name,
    notes,
    ...edgeList("edges out", data.edges.filter((e) => e.source === id), "out"),
    ...edgeList("edges in", data.edges.filter((e) => e.target === id), "in"),
  );
}

function showSummary() {
  const summary = document.createElement("p");
  summary.className = "panel-empty";
  summary.textContent = `${data.nodes.length} nodes, ${data.edges.length} edges. Select a node to inspect it.`;
  panel.replaceChildren(summary);
}

function select(id) {
  cy.elements().unselect();
  const node = cy.$id(id);
  node.select();
  cy.animate({ center: { eles: node } }, { duration: 233 });
}

cy.on("select", "node", (e) => {
  showNode(e.target.id());
  e.target.connectedEdges().addClass("adjacent");
});

cy.on("unselect", "node", (e) => {
  e.target.connectedEdges().removeClass("adjacent");
  if (cy.$("node:selected").length === 0) showSummary();
});

onThemeChange(() => cy.style(graphStyle()));

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    cy.resize();
    cy.fit(undefined, 21);
  }, 233);
});

showSummary();

// The graph is also explorable from the browser console.
window.cy = cy;
