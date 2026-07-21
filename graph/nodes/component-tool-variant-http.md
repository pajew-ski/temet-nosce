---
id: component-tool-variant-http
type: Component
notes: ["HTTP Request node as agent tool", "GET against the GitHub Contents API, one parameter: path", "generic, same pattern transfers to any REST API"]
edges:
  - {rel: fetches, target: component-graph-nodes}
  - {rel: alternative_to, target: component-tool-variant-github-node}
---

- HTTP Request node as agent tool
- GET against the GitHub Contents API, one parameter: path
- generic, same pattern transfers to any REST API
