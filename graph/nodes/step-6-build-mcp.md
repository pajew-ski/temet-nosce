---
id: step-6-build-mcp
type: Step
notes: ["wire up MCP Server Trigger + six tool nodes in n8n", "reads via plain HTTP like variant A, writes via the native GitHub node like variant B, it hides the base64/sha bookkeeping of the Contents API", "connect any MCP client to the server URL"]
edges:
  - {rel: produces, target: component-mcp-server}
---

- wire up MCP Server Trigger + six tool nodes in n8n
- reads via plain HTTP like variant A, writes via the native GitHub node like variant B, it hides the base64/sha bookkeeping of the Contents API
- connect any MCP client to the server URL
