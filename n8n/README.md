# n8n workflows

Three complete, independently runnable workflows: two variants of the same chat agent, and an MCP server that hands the graph to external clients ([jump to it](#mcp-server)).

The two chat variants both read the graph index from their system prompt and fetch node files from this repository on demand; they differ only in the retrieval tool. That difference is the point: the pattern is not tied to a specific tool.

Both variants share:

- **Chat Trigger**, public, in embedded chat mode, so the website widget can talk to it
- **AI Agent** whose system message contains the full content of `graph/index.md` plus short traversal instructions
- **OpenAI Chat Model** (`gpt-5-mini` by default, any chat model works)
- **Simple Memory**, so follow-up questions keep their context

## Variant A: `workflow-variant-a-http-tool.json` (recommended)

The tool is a plain HTTP Request node: `GET https://api.github.com/repos/pajew-ski/temet-nosce/contents/<path>` with the header `Accept: application/vnd.github.raw`, and a single model-filled parameter `path`. GitHub answers with the raw file text, which is exactly what the model wants to read.

Credentials: only OpenAI. The GitHub call runs unauthenticated, which is fine for a demo (60 requests per hour per IP). For the authenticated limit of 5000 per hour, create a GitHub credential with a fine-grained PAT that has no scopes, then set the tool node's Authentication to Predefined Credential Type with GitHub.

## Variant B: `workflow-variant-b-github-node.json`

The tool is the native n8n GitHub node: resource `File`, operation `Get`, with Owner and Repository fixed and File Path filled by the model. Less configuration, nothing to know about URLs or headers, but n8n- and GitHub-specific.

Credentials: OpenAI plus a GitHub credential; the native node requires one even for public repositories.

One honest caveat, verified against the n8n source: the native node in this mode returns the raw Contents API response, in which the file body sits in the `content` field, base64 encoded. The tool description tells the model to decode it, and small node files usually survive that round trip, but variant A hands the model clean text and is the variant to use when you want reliable answers rather than a wiring demonstration.

## Setup

1. In n8n: Workflows, Create Workflow, then import the JSON file (or drag it onto the canvas).
2. Open the OpenAI Chat Model node and select or create your OpenAI credential.
3. Variant B only: open Fetch Node File and select or create your GitHub credential.
4. Save and activate the workflow.
5. Open the Chat Trigger node, copy the production chat URL, and paste it into `WEBHOOK_URL` at the top of `docs/chat.js`. The trigger allows all origins by default; you can restrict Allowed Origins to your GitHub Pages domain in its options.

If you change the graph, run `bun scripts/sync-graph.mjs`. It rewrites the index inside both chat workflow JSONs as well, replacing only what follows the `THE INDEX` marker, so the files never drift from the nodes. Re-import the workflow into n8n (or paste the fresh block into the running Agent's system message) to pick up the change. The MCP server workflow is exempt from all of this: it embeds no index copy and reads `graph/index.md` live.

## MCP server

`workflow-mcp-server.json` exposes the graph over the [Model Context Protocol](https://modelcontextprotocol.io), so any MCP client, Claude Code, Claude Desktop, an IDE, another agent, can use it directly. It is the chat agent turned inside out: there is no model node and no index copy in the workflow. The client's model reads the index, decides what is relevant, and drives the multi-hop loop itself; n8n only serves the tools.

Six tools hang off an MCP Server Trigger:

- **`read_index`**: returns `graph/index.md` raw, the map everything else works from. Plain HTTP like variant A, unauthenticated.
- **`get_node`**: returns one node file raw, parameter `path` from an index block. One call per hop; this is the multi-hop retrieval tool.
- **`search_nodes`**: full-text search over the node bodies via GitHub's code search API, for what the index doesn't carry (the index has notes, not bodies). Returns matching paths with text fragments. GitHub requires auth for code search, and its index lags commits by a few minutes.
- **`create_node` / `update_node` / `delete_node`**: the write path, native GitHub nodes like variant B, because the native node hides the base64 and sha bookkeeping that Contents API writes need. The file path is locked to `graph/nodes/<id>.md` with only the id model-filled, so the tools cannot touch anything outside the graph. Each write is one commit to `main`.

Reindexing after a write is automatic and needs nothing from the client: the commit lands in `graph/nodes/`, that push event runs `sync-graph.yml`, and the action regenerates `graph/index.md`, `docs/graph-data.json`, and the chat workflow prompts. A new node shows up in `read_index` about a minute after `create_node` returns. If a write breaks the graph (an edge to a node that doesn't exist), the action fails validation instead of publishing a broken index; the delete tool's description tells the model to remove inbound edges first for exactly this reason.

### Setup

1. Import `workflow-mcp-server.json` like the others.
2. Create one GitHub credential and select it in the four nodes that need it: `search_nodes`, `create_node`, `update_node`, `delete_node`. A fine-grained PAT with read/write on **Contents**, scoped to this repository only, is enough and is also the sensible ceiling: it is the blast radius of the write tools.
3. Save and activate. Open the MCP Server Trigger and copy the production URL.
4. Connect a client. For Claude Code: `claude mcp add --transport http temet-nosce <production URL>`.

The trigger ships with no inbound authentication, which matches the rest of this public showcase but means anyone with the URL can call the write tools with your PAT behind them. For anything beyond a demo, set the trigger's Authentication to Bearer and give the token to your clients, or drop the three write tools and run it read-only.

### Forking the MCP server

Same idea as [below](#forking-this): the workflow cannot know your repo. After importing, point at your fork: the URLs in `read_index` and `get_node`, the `repo:` qualifier in the `search_nodes` query, the Owner/Repository fields in the three write tools, and the repo name wherever a tool description mentions it.

## Forking this

The website adapts on its own: its footer links derive the owner and repo from the GitHub Pages URL, so nothing there needs editing. The n8n workflow runs on a server and cannot know your repo, so after importing point these fields at your fork.

Both variants, in the **AI Agent** system message:

- the sentence naming `pajew-ski/temet-nosce`
- the link base `https://github.com/pajew-ski/temet-nosce/blob/main/`, used for the citation links in answers

Variant A, in the **Fetch Node File** HTTP node:

- the URL: `https://api.github.com/repos/<owner>/<repo>/contents/...`
- the tool description, which names the repo

Variant B, in the **Fetch Node File** GitHub node:

- the Owner and Repository parameters
- the tool description, which names the repo

Everything else, the `WEBHOOK_URL` in `docs/chat.js` and the credentials, is part of normal setup above.

## When to use which

Variant A whenever the answer quality matters, and whenever you want to transfer the pattern: swap the URL and the tool description, and the same one-parameter tool reads any REST API. Variant B when you want to see how a native n8n node becomes an agent tool with the least configuration, and the base64 detour is acceptable.

The MCP server is not an alternative to the variants but a different audience: the variants serve the website widget its answers, the MCP server serves your own tools the graph itself, including the pen to edit it.
