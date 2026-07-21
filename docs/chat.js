import { createChat } from "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js";

// Production chat URL of the Chat Trigger node, available after importing and
// activating one of the two workflow variants in n8n (see n8n/README.md).
const WEBHOOK_URL = "https://n8n.pajewski.net/webhook/082d33c3-5847-4dc9-8ab4-7be9064d2b78/chat";

// How the widget is presented. Two variants ship with the site, both talking
// to the same webhook; switch by changing this one constant.
//   "window"     — a floating action button in the corner that opens the chat
//                  in a popover. The embedded "Ask the agent" section is
//                  redundant in this mode and is removed.
//   "fullscreen" — the chat embedded in the "Ask the agent" section as a
//                  golden rectangle, the page's centerpiece.
const CHAT_MODE = "window";

// Theming lives in style.css: the widget reads --chat--* custom properties,
// which reference the site tokens and flip with prefers-color-scheme, so no
// JS re-theme is needed here. The floating toggle inherits --chat--color--primary.
const chatOptions = {
  webhookUrl: WEBHOOK_URL,
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
};

const container = document.querySelector("#chat-widget");

if (!WEBHOOK_URL) {
  const note = document.createElement("p");
  note.className = "chat-unwired";
  note.innerHTML =
    "The chat widget is wired but not yet connected. Import one of the two workflows from <code>n8n/</code>, activate it, and set <code>WEBHOOK_URL</code> at the top of <code>docs/chat.js</code> to the Chat Trigger's production URL.";
  container.classList.add("unwired");
  container.replaceChildren(note);
} else if (CHAT_MODE === "window") {
  // Floating action button: drop the embedded section and let the widget mount
  // its own toggle and popover on the page.
  document.querySelector("#chat")?.remove();
  createChat({ ...chatOptions, mode: "window" });
} else {
  createChat({ ...chatOptions, target: "#chat-widget", mode: "fullscreen" });
}
