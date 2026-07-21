---
id: step-3-generate-index
type: Step
notes: ["write scripts/sync-graph.mjs", "generate index.md and graph-data.json from it, do not write them by hand"]
edges:
  - {rel: produces, target: component-sync-script}
  - {rel: produces, target: component-graph-index}
  - {rel: next_step, target: step-4-build-n8n}
---

- write scripts/sync-graph.mjs
- generate index.md and graph-data.json from it, do not write them by hand
