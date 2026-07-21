---
id: component-n8n-agent
type: Component
notes: ["AI Agent node in n8n", "system prompt = content of graph/index.md", "also answers questions about itself"]
edges:
  - {rel: uses_tool, target: component-tool-variant-http}
  - {rel: uses_tool, target: component-tool-variant-github-node}
  - {rel: embedded_in, target: component-website}
---

- AI Agent node in n8n
- system prompt = content of graph/index.md
- also answers questions about itself
