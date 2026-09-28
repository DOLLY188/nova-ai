/* NOVA UI and browser-only preview. Replace novaProvider.respond() with a server API later. */
const MODES = [
  { id: 'core', name: 'Core', symbol: '✳', desc: 'Thoughtful, all-around help' },
  { id: 'flash', name: 'Flash', symbol: 'ϟ', desc: 'Quick answers, less fuss' },
  { id: 'code', name: 'Code', symbol: '</>', desc: 'Make and understand code' },
  { id: 'vision', name: 'Vision', symbol: '◉', desc: 'Explore images and ideas' },
  { id: 'live', name: 'Live', symbol: '◎', desc: 'Look into what’s current' },
  { id: 'agent', name: 'Agent', symbol: '⌘', desc: 'Plan work across steps' }
];
const STORAGE_KEY = 'nova.conversations.v1';
const state = { mode: 'auto', web: false, files: [], conversations: readConversations(), currentId: null };
const $ = (selector) => document.querySelector(selector);
const modeGrid = $('#mode-grid');
const messages = $('#messages');
const welcome = $('#welcome');
const input = $('#prompt-input');

modeGrid.innerHTML = MODES.map((mode) => `<button class="mode-card" data-mode="${mode.id}" aria-pressed="false"><span class="mode-top"><span class="mode-symbol">${mode.symbol}</span><span class="mode-name">${mode.name}</span></span><span class="mode-desc">${mode.desc}</span><span class="mode-tick">✓</span></button>`).join('') + `<div class="auto-row"><button class="auto-chip enabled" id="auto-mode" aria-pressed="true">✳ AUTO</button><span>Let NOVA choose the right mode</span></div>`;

function readConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((item) => item && item.id && Array.isArray(item.messages)) : [];
  } catch { return []; }
}
function persistConversations() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.conversations.slice(0, 30))); }
  catch { showToast('This browser could not save conversation history'); }
}
function drawRecentList() {
  const list = $('#recent-list');
  if (!state.conversations.length) {
    list.innerHTML = '<div class="recent-empty">Your conversations will appear here.</div>';
    return;
  }
  list.innerHTML = state.conversations.map((item) => `<button class="recent-item${item.id === state.currentId ? ' selected' : ''}" data-conversation="${escapeHTML(item.id)}"><span>◌</span><span class="recent-title">${escapeHTML(item.title)}</span></button>`).join('');
}
function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-card').forEach((card) => {
    const active = card.dataset.mode === mode;
    card.classList.toggle('selected', active);
    card.setAttribute('aria-pressed', String(active));
  });
  const auto = $('#auto-mode');
  auto.classList.toggle('enabled', mode === 'auto');
  auto.setAttribute('aria-pressed', String(mode === 'auto'));
  $('#mode-caption').textContent = mode === 'auto' ? 'AUTO · ADAPTIVE' : `${mode.toUpperCase()} · MODE`;
}
modeGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.mode-card');
  if (card) setMode(card.dataset.mode);
});
$('#auto-mode').addEventListener('click', () => setMode('auto'));

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2500);
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function chosenMode(prompt) {
  if (state.mode !== 'auto') return state.mode;
  if (/\b(code|function|script|debug|program|website|html|css|javascript|python)\b/i.test(prompt)) return 'code';
  if (/\b(image|photo|picture|draw|design|visual|video)\b/i.test(prompt) || state.files.length) return 'vision';
  if (/\b(current|latest|today|news|right now|weather|price)\b/i.test(prompt)) return 'live';
  if (/\b(plan|steps|organize|project|multi|workflow)\b/i.test(prompt)) return 'agent';
  return prompt.length < 55 ? 'flash' : 'core';
}
/* Replace this mock function with an adapter to an open model or your own API. */
const novaProvider = {
  async respond({ prompt, mode, files, web }) {
    return { kind: 'text', text: mockReply(prompt, mode, files, web) };
  }
};
function mockReply(prompt, mode, files, web) {
  const fileNote = files.length ? ` I see ${files.length} attached file${files.length === 1 ? '' : 's'}; image and document understanding will work once the model connection is added.` : '';
  const webNote = web ? ' Web search is switched on for this chat; it will become active after a search provider is connected.' : '';
  const lead = { core: 'Let’s work through that thoughtfully.', flash: 'Here’s a quick starting point.', code: 'Let’s shape this into something you can build.', vision: 'Let’s explore that visually.', live: 'Let’s look at what’s current.', agent: 'Let’s turn this into a clear set of steps.' }[mode];
  if (/\b(code|function|script|debug|program|website|html|css|javascript|python)\b/i.test(prompt) && mode === 'code') {
    return `${lead}\n\nThis workspace is ready for a coding model. For now, here’s a tiny example of the copyable code treatment:\n\n```js\n// Your coding agent can generate a complete solution here.\nfunction startWithAnIdea(idea) {\n  return { idea, nextStep: "Make a small first version" };\n}\n```\n\nYour request: “${prompt}”\n\n${fileNote}${webNote}`;
  }
  return `${lead}\n\n“${prompt}”\n\nThe interface is in place. Connect a model provider to get a real answer here; this preview keeps its API key and model choices out of the browser.${fileNote}${webNote}`;
}
function renderAssistantText(text) {
  return escapeHTML(text).replace(/```(\w*)\n([\s\S]*?)```/g, (_all, _language, code) => `<pre><button class="copy-code" type="button">Copy code</button><code>${code.trim()}</code></pre>`).replace(/\n/g, '<br>');
}
function addMessage(role, body, label) {
  const article = document.createElement('article');
  article.className = `message ${role}`;
  article.innerHTML = `<span class="message-label">${escapeHTML(label)}</span><div class="message-body">${body}</div>`;
  messages.appendChild(article);
  article.querySelectorAll('.copy-code').forEach((button) => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.nextElementSibling.textContent); button.textContent = 'Copied'; }
    catch { showToast('Clipboard access is unavailable in this browser'); }
    setTimeout(() => button.textContent = 'Copy code', 1200);
  }));
  return article;
}
function saveMessage(role, text, label, conversationId = state.currentId) {
  const item = state.conversations.find((conversation) => conversation.id === conversationId);
  if (!item) return;
  item.messages.push({ role, text, label });
  item.updatedAt = Date.now();
  state.conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  persistConversations();
  drawRecentList();
}
function showConversation(item) {
  state.currentId = item?.id ?? null;
  messages.innerHTML = '';
  welcome.hidden = Boolean(item);
  document.querySelector('.breadcrumb strong').textContent = item?.title || 'New conversation';
  if (item) item.messages.forEach((message) => addMessage(message.role, message.role === 'assistant' ? renderAssistantText(message.text) : escapeHTML(message.text), message.label));
  drawRecentList();
  if (innerWidth <= 700) $('#sidebar').classList.remove('open');
}
function startNewConversation() {
  state.currentId = null;
  messages.innerHTML = '';
  welcome.hidden = false;
  document.querySelector('.breadcrumb strong').textContent = 'New conversation';
  input.value = '';
  input.style.height = 'auto';
  state.files = [];
  renderFiles();
  setMode('auto');
  drawRecentList();
  if (innerWidth <= 700) $('#sidebar').classList.remove('open');
  input.focus();
}
async function sendMessage(text) {
  const prompt = text.trim();
  if (!prompt) return;
  const mode = chosenMode(prompt);
  const modeLabel = MODES.find((item) => item.id === mode)?.name ?? 'Core';
  if (!state.currentId) {
    state.currentId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    state.conversations.unshift({ id: state.currentId, title: prompt.slice(0, 52), messages: [], updatedAt: Date.now() });
  }
  welcome.hidden = true;
  const current = state.conversations.find((item) => item.id === state.currentId);
  const title = current?.title ?? prompt.slice(0, 52);
  const conversationId = state.currentId;
  if (current && !current.messages.length) current.title = prompt.slice(0, 52);
  addMessage('user', escapeHTML(prompt), 'YOU');
  saveMessage('user', prompt, 'YOU', conversationId);
  const typing = addMessage('assistant', '<span class="typing"><i></i><i></i><i></i></span>', `${modeLabel.toUpperCase()} · NOVA`);
  const currentFiles = [...state.files];
  state.files = [];
  renderFiles();
  messages.scrollIntoView({ behavior: 'smooth', block: 'end' });
  try {
    const result = await novaProvider.respond({ prompt, mode, files: currentFiles, web: state.web });
    typing.querySelector('.message-body').innerHTML = renderAssistantText(result.text);
    saveMessage('assistant', result.text, `${modeLabel.toUpperCase()} · NOVA`, conversationId);
  } catch {
    const errorText = 'That did not work this time. Try again in a moment.';
    typing.querySelector('.message-body').textContent = errorText;
    saveMessage('assistant', errorText, `${modeLabel.toUpperCase()} · NOVA`, conversationId);
  }
  if (title) document.querySelector('.breadcrumb strong').textContent = title;
}

$('#composer').addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value;
  input.value = '';
  input.style.height = 'auto';
  await sendMessage(text);
});
input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 150)}px`; });
input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('#composer').requestSubmit(); } });
document.querySelectorAll('.quick-prompts button').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.prompt; input.focus(); input.dispatchEvent(new Event('input')); }));
$('#recent-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-conversation]');
  if (button) showConversation(state.conversations.find((item) => item.id === button.dataset.conversation));
});
$('#new-chat').addEventListener('click', startNewConversation);
$('#web-toggle').addEventListener('click', (event) => { state.web = !state.web; event.currentTarget.classList.toggle('on', state.web); showToast(state.web ? 'Web search selected · connect a provider to enable it' : 'Web search turned off'); });
$('#attach-button').addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', (event) => { state.files.push(...Array.from(event.target.files)); renderFiles(); event.target.value = ''; });
function renderFiles() {
  $('#attachment-preview').innerHTML = state.files.map((file, index) => `<span class="attachment-chip">▧ ${escapeHTML(file.name)} <button type="button" data-remove="${index}" aria-label="Remove ${escapeHTML(file.name)}">×</button></span>`).join('');
  $('#attachment-preview').querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => { state.files.splice(Number(button.dataset.remove), 1); renderFiles(); }));
}
$('#workspace-toggle').addEventListener('click', () => $('#workspace-panel').classList.toggle('open'));
$('#close-panel').addEventListener('click', () => $('#workspace-panel').classList.remove('open'));
$('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#dismiss-note').addEventListener('click', (event) => event.currentTarget.closest('.sidebar-note').remove());
$('#roadmap-button').addEventListener('click', () => { $('#modal').hidden = false; $('#modal-close').focus(); });
$('#modal-close').addEventListener('click', () => $('#modal').hidden = true);
$('#modal').addEventListener('click', (event) => { if (event.target.id === 'modal') event.currentTarget.hidden = true; });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { $('#modal').hidden = true; $('#sidebar').classList.remove('open'); $('#workspace-panel').classList.remove('open'); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); startNewConversation(); } });
$('#add-project').addEventListener('click', () => showToast('Projects are ready for a future workspace connection'));
$('#empty-project').addEventListener('click', () => showToast('Your project space will be ready when project saving is connected'));
document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-nav]').forEach((item) => item.classList.toggle('active', item === button)); if (button.dataset.nav !== 'chat') showToast(`${button.textContent.trim()} will grow into this workspace soon`); }));
drawRecentList();
if (state.conversations[0]) showConversation(state.conversations[0]);
