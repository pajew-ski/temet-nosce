import { createChat } from "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js";

// Production chat URL of the Chat Trigger node, available after importing and
// activating one of the two workflow variants in n8n (see n8n/README.md).
const WEBHOOK_URL = "https://n8n.pajewski.net/webhook/082d33c3-5847-4dc9-8ab4-7be9064d2b78/chat";

// Theming lives in style.css: the widget reads --chat--* custom properties,
// which reference the site tokens and flip with prefers-color-scheme, so no
// JS re-theme is needed here.
if (WEBHOOK_URL) {
  createChat({
    webhookUrl: WEBHOOK_URL,
    target: "#chat-widget",
    mode: "fullscreen",
    showWelcomeScreen: false,
    initialMessages: [
      "I am the agent this site describes.",
      "Ask me what I am, or how you would build me.",
    ],
    i18n: {
      en: {
        title: "temet nosce",
        subtitle: "Graph retrieval, one hop at a time.",
        inputPlaceholder: "Ask about the graph, the agent, or the build path",
        getStarted: "New conversation",
        footer: "",
        closeButtonTooltip: "Close",
      },
    },
  });
} else {
  const note = document.createElement("p");
  note.className = "chat-unwired";
  note.innerHTML =
    "The chat widget is wired but not yet connected. Import one of the two workflows from <code>n8n/</code>, activate it, and set <code>WEBHOOK_URL</code> at the top of <code>docs/chat.js</code> to the Chat Trigger's production URL.";
  const container = document.querySelector("#chat-widget");
  container.classList.add("unwired");
  container.replaceChildren(note);
}
