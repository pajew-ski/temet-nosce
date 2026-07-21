---
id: component-sync-script
type: Component
notes: ["scripts/sync-graph.mjs", "reads all node frontmatters, generates index.md and graph-data.json", "runs locally via bun, or automatically via GitHub Action"]
edges:
  - {rel: produces, target: component-graph-index}
  - {rel: mitigates, target: limitations-of-the-pattern}
---

- scripts/sync-graph.mjs
- reads all node frontmatters, generates index.md and graph-data.json
- runs locally via bun, or automatically via GitHub Action
