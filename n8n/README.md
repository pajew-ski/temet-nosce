# n8n workflows

Two complete, independently runnable variants of the same agent. Both read the graph index from their system prompt and fetch node files from this repository on demand; they differ only in the retrieval tool. That difference is the point: the pattern is not tied to a specific tool.

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

If you change the graph, run `bun scripts/sync-graph.mjs`. It rewrites the index inside both workflow JSONs as well, replacing only what follows the `THE INDEX` marker, so the files never drift from the nodes. Re-import the workflow into n8n (or paste the fresh block into the running Agent's system message) to pick up the change.

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
