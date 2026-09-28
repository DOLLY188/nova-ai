# NOVA — the starting workspace

NOVA is a small, original AI workspace prototype built with plain HTML, CSS, and JavaScript. It has no paid service dependency and no build step. It can be hosted as a static site on GitHub Pages.

## Open it

Open `index.html` in a modern browser, or publish the `nova-ai` folder with GitHub Pages. Google Fonts are optional; the page falls back to system sans-serif fonts when offline.

## What is here

- Six selectable modes: Core, Flash, Code, Vision, Live, and Agent, plus Auto routing.
- Responsive chat workspace, recent conversation list, and collapsible project canvas.
- A usable composer with local attachment selection, a web-search switch, quick prompts, and copyable code blocks.
- Conversation history saved locally in the current browser. It is not synced between devices or sent to a server.
- A replaceable `novaProvider.respond()` seam. The current response is explicitly a local preview, not a connected AI model.

## Simple build roadmap

1. **Foundation (this version):** visual system, responsive layout, mode selection, Auto heuristics, and chat interactions.
2. **Model connection:** add a small server-side endpoint and connect an open model. Keep API keys on the server. Start with a local option such as Ollama for $0, or evaluate a free hosted tier when needed; check current limits before depending on any service.
3. **Current information and files:** add a search adapter and server-side parsing for uploaded files. Browser file selection is only a UI hook in this version; file contents are not uploaded.
4. **Vision and media:** send image inputs to a vision model; add image generation and video services behind separate provider adapters.
5. **Code and projects:** connect a coding workflow to a sandboxed project workspace; persist named conversations and project files.
6. **Memory and Agent:** add user-controlled memory, then explicit multi-step tool execution with progress, review, and stop controls.

## Safe integration shape

Replace `novaProvider.respond()` in `app.js` with a request to your own server endpoint. The server can select a model by mode while the frontend keeps the same message and mode interface. Never put a provider secret in `app.js` or commit one to GitHub. Avoid treating browser-provided files or model output as trusted instructions.

Conversation text is saved in the browser on the device where you use it. Attachments are only selected locally for the current page and are not uploaded, saved, or sent to a server.
