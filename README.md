# temet nosce

Know thyself. An n8n agent that explains itself and its own blueprint through graph retrieval, without a vector database and without embeddings. The knowledge graph describes the very repository the agent lives in, including the build spec it was generated from.

**Site**: [pajew-ski.github.io/temet-nosce](https://pajew-ski.github.io/temet-nosce/) (explanation, interactive graph, chat widget)

## How it works

Twenty markdown files under `graph/nodes/` are the graph: YAML frontmatter with an id, a type, and directed edges. A small script aggregates them into `graph/index.md`, a flat text index that fits entirely into the system prompt of an n8n AI Agent. The model reads the index, decides which node a question is about, and fetches that node's file from this repository with a tool, one hop at a time. No embeddings anywhere; the retrieval logic is language understanding plus explicit edges.

## Getting it running

1. **Pages**: Settings, Pages, deploy from branch `main`, folder `/docs`.
2. **Agent**: import one of the two workflows from [`n8n/`](n8n/README.md) into n8n, add credentials, activate.
3. **Widget**: paste the Chat Trigger's production URL into `WEBHOOK_URL` in `docs/chat.js`.

Forking it: the website's source links adapt to your repo automatically (derived from the GitHub Pages URL). Only the n8n workflow needs its repo fields pointed at your fork; [`n8n/README.md`](n8n/README.md#forking-this) lists exactly which ones.

## Editing the graph

Edit or add a file under `graph/nodes/`, then run `bun scripts/sync-graph.mjs`. It validates every edge and regenerates `graph/index.md` and `docs/graph-data.json`; a GitHub Action does the same on push, so the index can never silently drift from the nodes.

Everything here was built by a coding agent from [AGENTS.md](AGENTS.md), which is itself the first node of the graph.

## License

The code is licensed under the MIT License; see [LICENSE](LICENSE).

The knowledge graph is dedicated to the public domain under Creative Commons Zero (CC0 1.0); see [graph/LICENSE](graph/LICENSE). This covers the node files under `graph/nodes/` and everything generated from them: `graph/index.md` and `docs/graph-data.json`. Use the graph for anything, no attribution required.

