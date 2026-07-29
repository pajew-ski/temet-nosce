---
id: component-mcp-server
type: Component
notes: ["MCP Server Trigger workflow in n8n, no model inside, the connecting client brings its own", "read tools: read_index, get_node, search_nodes", "write tools: create_node, update_node, delete_node, one commit to graph/nodes/ each", "every write triggers the sync action, so the index reindexes automatically"]
edges:
  - {rel: reads, target: component-graph-index}
  - {rel: fetches, target: component-graph-nodes}
  - {rel: writes, target: component-graph-nodes}
  - {rel: triggers, target: component-sync-script}
---

- MCP Server Trigger workflow in n8n, no model inside, the connecting client brings its own
- read tools: read_index, get_node, search_nodes
- write tools: create_node, update_node, delete_node, one commit to graph/nodes/ each
- every write triggers the sync action, so the index reindexes automatically
