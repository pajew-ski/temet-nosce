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
        opacity: 0.55,
        // The relation type rides on the edge itself, so the meaning of a link is
        // legible in the graph without opening the panel. autorotate keeps it
        // aligned with the line; the background chip lifts it off crossing edges.
        label: (e) => e.data("rel").replaceAll("_", " "),
        "font-family": font,
        "font-size": 6,
        color: muted,
        "text-rotation": "autorotate",
        "text-background-color": bg,
        "text-background-opacity": 1,
        "text-background-padding": 1,
        "text-background-shape": "roundrectangle",
      },
    },
    {
      selector: "edge.adjacent",
      style: { "line-color": muted, "target-arrow-color": muted, opacity: 1, color: text, "font-size": 8 },
    },
  ];
}

const data = await (await fetch("graph-data.json")).json();
const panel = document.querySelector("#panel");
const nodesById = new Map(data.nodes.map((n) => [n.id, n]));

// Radial layout: the project sits at the center, the build steps form an inner
// ring in sequence order (clockwise from the top), and everything else sits on
// outer rings by role. Each outer node is pulled toward the mean angle of the
// inner neighbours it connects to, so related nodes end up near one another.
// Positions are in model space; cytoscape fits them to the canvas.
function radialPositions(nodes, edges) {
  const LEVEL = { Project: 0, Step: 1, Component: 2, Concept: 3, Limitation: 3 };
  const RADIUS = [0, 150, 300, 450];
  const neighbours = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) {
    neighbours.get(e.source)?.push(e.target);
    neighbours.get(e.target)?.push(e.source);
  }
  const angle = new Map(); // only ring nodes get an angle; the center has none
  const pos = {};
  const place = (id, r, a) => {
    angle.set(id, a);
    pos[id] = { x: r * Math.cos(a), y: r * Math.sin(a) };
  };
  const meanAngle = (as) => {
    if (!as.length) return null;
    const x = as.reduce((s, a) => s + Math.cos(a), 0);
    const y = as.reduce((s, a) => s + Math.sin(a), 0);
    return x === 0 && y === 0 ? null : Math.atan2(y, x);
  };
  const anchorOf = (id) =>
    meanAngle(neighbours.get(id).map((t) => angle.get(t)).filter((v) => v != null));

  // Center: position only, no angle, so it never biases an outer node's anchor.
  const center = nodes.find((n) => n.type === "Project");
  if (center) pos[center.id] = { x: 0, y: 0 };

  // Inner ring: build steps in sequence order, clockwise from the top.
  const steps = nodes.filter((n) => n.type === "Step").sort((a, b) => a.id.localeCompare(b.id));
  steps.forEach((n, i) => place(n.id, RADIUS[1], -Math.PI / 2 + (i * 2 * Math.PI) / steps.length));

  // Widest circular gap in a sorted angle list; returns its midpoint. Used to
  // slot nodes that have no inner neighbour to anchor to.
  const widestGapMid = (sorted) => {
    if (sorted.length === 0) return -Math.PI / 2;
    let gi = 0, best = -1;
    for (let i = 0; i < sorted.length; i++) {
      let g = sorted[(i + 1) % sorted.length] - sorted[i];
      if (g <= 0) g += 2 * Math.PI;
      if (g > best) { best = g; gi = i; }
    }
    let a1 = sorted[gi], a2 = sorted[(gi + 1) % sorted.length];
    if (a2 <= a1) a2 += 2 * Math.PI;
    return (a1 + a2) / 2;
  };

  // Place one ring: order the nodes by the angle of their inner neighbours, then
  // space them evenly (so labels never collide) and rotate the whole ring by the
  // offset that best lines the nodes up with those neighbours. Nodes without an
  // inner neighbour drop into the widest gap so they land somewhere sensible.
  const placeRing = (ring, radius) => {
    const n = ring.length;
    if (n === 0) return;
    const items = ring.map((node) => ({ id: node.id, a: anchorOf(node.id) }));
    const used = items.filter((it) => it.a != null).map((it) => it.a).sort((x, y) => x - y);
    for (const it of items) {
      if (it.a != null) continue;
      it.a = widestGapMid(used);
      used.push(((it.a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
      used.sort((x, y) => x - y);
    }
    items.sort((p, q) => p.a - q.a);
    let sx = 0, sy = 0;
    items.forEach((it, i) => {
      const anchor = anchorOf(it.id);
      if (anchor == null) return;
      const even = (i * 2 * Math.PI) / n;
      sx += Math.cos(anchor - even);
      sy += Math.sin(anchor - even);
    });
    const offset = sx === 0 && sy === 0 ? -Math.PI / 2 : Math.atan2(sy, sx);
    items.forEach((it, i) => place(it.id, radius, (i * 2 * Math.PI) / n + offset));
  };

  placeRing(nodes.filter((node) => LEVEL[node.type] === 2), RADIUS[2]);
  placeRing(nodes.filter((node) => LEVEL[node.type] === 3), RADIUS[3]);
  return pos;
}

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
    name: "preset",
    positions: radialPositions(data.nodes, data.edges),
    padding: 34,
    fit: true,
  },
  // The floor must sit below the fit zoom of the smallest phones (~0.11 on a
  // 320px viewport), or fit() clamps and crops the graph instead of fitting it.
  minZoom: 0.1,
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
  list.className = "edge-list";
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

// Keep the graph fitted to its container across window resizes, orientation
// flips, and the portrait/landscape reflow that changes the canvas dimensions.
// A ResizeObserver on the canvas catches every size change, not just
// window-level ones, and fires once on attach so the initial layout is fitted
// to the settled box rather than whatever size it had mid-render.
const canvas = document.querySelector("#canvas");
let resizeTimer;
new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    cy.resize();
    cy.fit(undefined, 34);
  }, 120);
}).observe(canvas);

showSummary();

// The graph is also explorable from the browser console.
window.cy = cy;
