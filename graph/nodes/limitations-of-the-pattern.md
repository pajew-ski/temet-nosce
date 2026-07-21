---
id: limitations-of-the-pattern
type: Limitation
notes: ["without the sync script the index would drift from the nodes, prevented here by scripts/sync-graph.mjs", "the index still grows linearly with node count, becomes too large for the context past a few hundred nodes"]
edges:
  - {rel: affects, target: component-graph-index}
  - {rel: affects, target: component-graph-nodes}
---

- without the sync script the index would drift from the nodes, prevented here by scripts/sync-graph.mjs
- the index still grows linearly with node count, becomes too large for the context past a few hundred nodes
