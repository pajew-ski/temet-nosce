---
id: step-4-build-n8n
type: Step
notes: ["wire up Chat Trigger + AI Agent node", "connect one of the two tool variants (or both, for comparison)", "insert index.md as the system prompt"]
edges:
  - {rel: produces, target: component-n8n-agent}
  - {rel: produces, target: component-tool-variant-http}
  - {rel: produces, target: component-tool-variant-github-node}
  - {rel: next_step, target: step-5-build-website}
---

- wire up Chat Trigger + AI Agent node
- connect one of the two tool variants (or both, for comparison)
- insert index.md as the system prompt
