---
id: component-sync-script
type: Component
notes: ["scripts/sync-graph.mjs", "reads all node frontmatters, generates index.md, graph-data.json, and the index inside both n8n workflows", "runs locally via bun, or automatically via GitHub Action"]
edges:
  - {rel: produces, target: component-graph-index}
  - {rel: mitigates, target: limitations-of-the-pattern}
---

- scripts/sync-graph.mjs
- reads all node frontmatters, generates index.md, graph-data.json, and the index inside both n8n workflows
- runs locally via bun, or automatically via GitHub Action
