import { el } from "../../js/core/helpers.js";

const state = {
  categories: [],
  selectedId: "",
  originalId: "",
  guide: null,
  previewNodeId: "",
  editingMode: false,
  dirty: false
};

const hosts = {};

function textLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function linesText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeId(title) {
  const words = String(title || "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "newGuide";
  return words[0].toLowerCase() + words.slice(1).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}

function emptyGuide() {
  return {
    id: "newGuide",
    title: "New Guide",
    cardText: ["Describe what this guide helps diagnose."],
    icon: "",
    text: ["Explain when to use this guide."],
    startNode: "start",
    nodes: {
      start: {
        title: "First check",
        body: ["Describe the first troubleshooting check."],
        successLabel: "Yes",
        failLabel: "No",
        successNext: null,
        failNext: null
      }
    }
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const messages = data.errors || [data.error || `Request failed (${response.status}).`];
    throw new Error(messages.join("\n"));
  }
  return data;
}

function showStatus(message, type = "") {
  hosts.status.replaceChildren();
  if (!message) return;
  const box = el("div", `status-message${type ? ` status-message--${type}` : ""}`);
  String(message).split("\n").forEach((line) => box.appendChild(el("div", "", line)));
  hosts.status.appendChild(box);
}

function markDirty() {
  state.dirty = true;
  showStatus("Unsaved changes.");
}

function buildShell() {
  const app = el("div", "app editor-app");
  const header = el("header", "header-centered");
  header.appendChild(el("h1", "", "IT Guide Editor"));

  const themeWrapper = el("div", "theme-toggle-wrapper");
  const themeButton = el("button", "theme-toggle");
  themeButton.type = "button";
  themeButton.setAttribute("aria-label", "Toggle light/dark mode");
  themeButton.setAttribute("aria-pressed", "false");
  themeButton.append(el("span", "theme-toggle-icon", "☾"), el("span", "theme-toggle-text", "Theme"));
  themeWrapper.appendChild(themeButton);
  header.appendChild(themeWrapper);

  const nav = el("nav", "nav");
  nav.setAttribute("aria-label", "Editor navigation");
  const links = el("div", "nav-links");
  const publicLink = el("a", "", "Public Site");
  publicLink.href = "../index.html";
  const editorLink = el("a", "", "Guide Editor");
  editorLink.href = "./";
  editorLink.setAttribute("aria-current", "page");
  links.append(publicLink, editorLink);
  nav.appendChild(links);
  header.appendChild(nav);

  const status = el("div", "status-container");
  const main = el("main", "split");
  main.id = "root";
  const listPane = el("section", "pane editor-list-pane");
  const editPane = el("section", "pane editor-main-pane");
  const previewPane = el("section", "pane editor-preview-pane pane-host--decision-tree");
  main.append(listPane, editPane, previewPane);

  const footer = el("footer", "footer");
  footer.appendChild(el("p", "", `© ${new Date().getFullYear()} Nigel Galbraith`));

  app.append(header, status, main, footer);
  document.getElementById("app").replaceChildren(app);
  Object.assign(hosts, { status, listPane, editPane, previewPane, themeButton });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  hosts.themeButton.setAttribute("aria-pressed", String(theme === "light"));
  hosts.themeButton.querySelector(".theme-toggle-icon").textContent = theme === "light" ? "☀" : "☾";
}

function initTheme() {
  const preferred = localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  applyTheme(preferred);
  hosts.themeButton.addEventListener("click", () => {
    applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
  });
}

function categoryById(id) {
  return state.categories.find((category) => category.id === id);
}

function selectedCategoryId() {
  return hosts.categorySelect?.value || state.categories[0]?.id || "";
}

function renderGuideList() {
  const pane = hosts.listPane;
  pane.replaceChildren();
  pane.classList.toggle("editing-mode", state.editingMode);

  const browser = el("div", `guide-browser${state.editingMode ? " hidden" : ""}`);
  const toolbar = el("div", "editor-toolbar editor-toolbar--centered");
  toolbar.appendChild(el("h2", "", "Guides"));
  const actions = el("div", "centered-actions");
  const newButton = el("button", "editor-button-success", "New Guide");
  newButton.type = "button";
  newButton.addEventListener("click", newGuide);
  actions.appendChild(newButton);
  toolbar.appendChild(actions);
  browser.appendChild(toolbar);

  const list = el("div", "guide-list");
  state.categories.forEach((category) => {
    if (!category.guides.length) return;
    const heading = el("h3", "", category.title);
    list.appendChild(heading);
    category.guides.forEach((guide) => {
      const button = el("button", "guide-list-item");
      button.type = "button";
      button.setAttribute("aria-current", String(guide.id === state.selectedId));
      button.append(el("span", "", guide.title), el("span", "node-badge", guide.id));
      button.addEventListener("click", () => loadGuide(guide.id));
      list.appendChild(button);
    });
  });
  if (!list.children.length) list.appendChild(el("p", "empty-message", "No guides found."));
  browser.appendChild(list);

  const editingHeader = el("div", `guide-editing-header${state.editingMode ? "" : " hidden"}`);
  const backButton = el("button", "", "← Back to Guides");
  backButton.type = "button";
  backButton.addEventListener("click", backToGuides);
  editingHeader.appendChild(backButton);

  pane.append(browser, editingHeader);
}

function backToGuides() {
  if (state.dirty && !confirm("Discard unsaved changes?")) return;
  state.guide = null;
  state.selectedId = "";
  state.originalId = "";
  state.previewNodeId = "";
  state.editingMode = false;
  state.dirty = false;
  renderGuideList();
  renderEditor();
  renderPreview();
  showStatus("");
}

function createField(labelText, input, wide = false, help = "") {
  const wrapper = el("div", `form-field${wide ? " form-field--wide" : ""}`);
  const label = el("label", "", labelText);
  if (!input.id) input.id = `field-${Math.random().toString(36).slice(2)}`;
  label.htmlFor = input.id;
  wrapper.append(label, input);
  if (help) wrapper.appendChild(el("p", "field-help", help));
  return wrapper;
}

function makeInput(value, onChange, type = "text") {
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  input.addEventListener("input", () => onChange(input.value));
  return input;
}

function makeTextarea(value, onChange) {
  const input = document.createElement("textarea");
  input.value = value ?? "";
  input.addEventListener("input", () => onChange(input.value));
  return input;
}

function destinationSelect(value, currentNodeId, onChange) {
  const select = document.createElement("select");
  select.appendChild(new Option("End guide", ""));
  Object.keys(state.guide.nodes).forEach((nodeId) => {
    select.appendChild(new Option(nodeId === currentNodeId ? `${nodeId} (this node)` : nodeId, nodeId));
  });
  select.value = value || "";
  select.addEventListener("change", () => onChange(select.value || null));
  return select;
}

function renderEditor() {
  const pane = hosts.editPane;
  pane.replaceChildren();
  if (!state.guide) {
    pane.appendChild(el("p", "empty-message", "Choose a guide or create a new one."));
    return;
  }

  const toolbar = el("div", "editor-toolbar editor-toolbar--stacked");
  toolbar.appendChild(el("h2", "", state.originalId ? "Edit Guide" : "New Guide"));
  const actions = el("div", "editor-actions centered-actions");
  const validateButton = el("button", "", "Validate");
  validateButton.type = "button";
  validateButton.addEventListener("click", () => showValidation(true));
  const saveButton = el("button", "editor-button-success", "Save Guide");
  saveButton.type = "button";
  saveButton.addEventListener("click", saveGuide);
  actions.append(validateButton, saveButton);
  if (state.originalId) {
    const deleteButton = el("button", "editor-button-danger", "Delete");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", deleteGuide);
    actions.appendChild(deleteButton);
  }
  toolbar.appendChild(actions);
  pane.appendChild(toolbar);

  const form = el("div", "editor-form");
  const details = el("div", "form-grid");

  const titleInput = makeInput(state.guide.title, (value) => {
    state.guide.title = value;
    if (!state.originalId && state.guide.id === "newGuide") state.guide.id = makeId(value);
    markDirty();
    renderEditor();
    renderPreview();
  });
  details.appendChild(createField("Title", titleInput));

  const idInput = makeInput(state.guide.id, (value) => {
    state.guide.id = value.trim();
    markDirty();
  });
  details.appendChild(createField("Guide ID", idInput, false, "Used for the filename and URL. Example: cannotPrint"));

  const categorySelect = document.createElement("select");
  state.categories.forEach((category) => categorySelect.appendChild(new Option(category.title, category.id)));
  categorySelect.value = state.categoryId || state.categories[0]?.id || "";
  categorySelect.addEventListener("change", () => {
    state.categoryId = categorySelect.value;
    markDirty();
  });
  hosts.categorySelect = categorySelect;
  details.appendChild(createField("Category", categorySelect));

  const iconInput = makeInput(state.guide.icon || "", (value) => {
    state.guide.icon = value.trim();
    markDirty();
  });
  details.appendChild(createField("Icon path", iconInput, false, "Optional. Keep blank when no icon is needed."));

  const cardText = makeTextarea(linesText(state.guide.cardText), (value) => {
    state.guide.cardText = textLines(value);
    markDirty();
  });
  details.appendChild(createField("Card description — one paragraph per line", cardText, true));

  const introText = makeTextarea(linesText(state.guide.text), (value) => {
    state.guide.text = textLines(value);
    markDirty();
  });
  details.appendChild(createField("Guide introduction — one paragraph per line", introText, true));
  form.appendChild(details);

  const nodeToolbar = el("div", "editor-toolbar");
  nodeToolbar.appendChild(el("h2", "", "Nodes"));
  form.appendChild(nodeToolbar);

  const nodeList = el("div", "node-list");
  Object.entries(state.guide.nodes).forEach(([nodeId, node]) => nodeList.appendChild(renderNode(nodeId, node)));
  form.appendChild(nodeList);

  const questionActions = el("div", "centered-actions");
  const questionButton = el("button", "", "Add Question");
  questionButton.type = "button";
  questionButton.addEventListener("click", () => addNode(false));
  questionActions.appendChild(questionButton);
  form.appendChild(questionActions);

  const validationHost = el("div", "");
  hosts.validation = validationHost;
  form.appendChild(validationHost);
  pane.appendChild(form);
  showValidation(false);
}

function renderNode(nodeId, node) {
  const card = el("article", `node-card${state.guide.startNode === nodeId ? " node-card--start" : ""}`);
  const heading = el("div", "node-heading");
  heading.append(el("h3", "", node.title || nodeId), el("span", "node-badge", node.type === "terminal" ? "Outcome" : "Question"));
  card.appendChild(heading);

  const grid = el("div", "form-grid");
  const idInput = makeInput(nodeId, (value) => renameNode(nodeId, value.trim()));
  grid.appendChild(createField("Node ID", idInput, false, "Changing an ID also updates links to it."));

  const typeSelect = document.createElement("select");
  typeSelect.append(new Option("Question", "question"), new Option("Outcome", "terminal"));
  typeSelect.value = node.type === "terminal" ? "terminal" : "question";
  typeSelect.addEventListener("change", () => {
    if (typeSelect.value === "terminal") {
      node.type = "terminal";
      delete node.successLabel;
      delete node.failLabel;
      node.successNext = null;
      node.failNext = null;
    } else {
      delete node.type;
      node.successLabel ||= "Yes";
      node.failLabel ||= "No";
    }
    markDirty();
    renderEditor();
    renderPreview();
  });
  grid.appendChild(createField("Node type", typeSelect));

  const titleInput = makeInput(node.title || "", (value) => {
    node.title = value;
    markDirty();
    renderPreview();
  });
  grid.appendChild(createField("Title", titleInput, true));

  const bodyInput = makeTextarea(linesText(node.body), (value) => {
    node.body = textLines(value);
    markDirty();
    renderPreview();
  });
  grid.appendChild(createField("Body — one paragraph per line", bodyInput, true));
  card.appendChild(grid);

  if (node.type !== "terminal") {
    const answerGrid = el("div", "answer-grid");
    answerGrid.appendChild(createField("Positive answer", makeInput(node.successLabel || "", (value) => {
      node.successLabel = value;
      markDirty();
      renderPreview();
    })));
    answerGrid.appendChild(createField("Goes to", destinationSelect(node.successNext, nodeId, (value) => {
      node.successNext = value;
      markDirty();
    })));
    answerGrid.appendChild(createField("Negative answer", makeInput(node.failLabel || "", (value) => {
      node.failLabel = value;
      markDirty();
      renderPreview();
    })));
    answerGrid.appendChild(createField("Goes to", destinationSelect(node.failNext, nodeId, (value) => {
      node.failNext = value;
      markDirty();
    })));
    card.appendChild(answerGrid);
  }

  const actions = el("div", "node-actions");
  const startButton = el("button", "", state.guide.startNode === nodeId ? "Start Node" : "Make Start");
  startButton.type = "button";
  startButton.disabled = state.guide.startNode === nodeId;
  startButton.addEventListener("click", () => {
    state.guide.startNode = nodeId;
    state.previewNodeId = nodeId;
    markDirty();
    renderEditor();
    renderPreview();
  });
  const removeButton = el("button", "editor-button-danger", "Remove Node");
  removeButton.type = "button";
  removeButton.disabled = Object.keys(state.guide.nodes).length <= 1;
  removeButton.addEventListener("click", () => removeNode(nodeId));
  actions.append(startButton, removeButton);
  card.appendChild(actions);
  if (node.type !== "terminal") {
    const outcomeActions = el("div", "node-footer-actions");
    const outcomeButton = el("button", "", "Add Outcome");
    outcomeButton.type = "button";
    outcomeButton.addEventListener("click", () => addNode(true));
    outcomeActions.appendChild(outcomeButton);
    card.appendChild(outcomeActions);
  }
  return card;
}

function uniqueNodeId(prefix) {
  let number = 1;
  let candidate = prefix;
  while (state.guide.nodes[candidate]) candidate = `${prefix}${number++}`;
  return candidate;
}

function addNode(terminal) {
  const id = uniqueNodeId(terminal ? "outcome" : "question");
  state.guide.nodes[id] = terminal
    ? { type: "terminal", title: "New outcome", body: ["Describe the result or next action."], successNext: null, failNext: null }
    : { title: "New question", body: ["Describe the troubleshooting check."], successLabel: "Yes", failLabel: "No", successNext: null, failNext: null };
  state.previewNodeId = id;
  markDirty();
  renderEditor();
  renderPreview();
}

function renameNode(oldId, newId) {
  if (!newId || newId === oldId) return;
  if (state.guide.nodes[newId]) {
    showStatus(`Node ID "${newId}" already exists.`, "error");
    renderEditor();
    return;
  }
  const renamed = {};
  Object.entries(state.guide.nodes).forEach(([id, node]) => {
    renamed[id === oldId ? newId : id] = node;
    ["successNext", "failNext"].forEach((property) => {
      if (node[property] === oldId) node[property] = newId;
    });
  });
  state.guide.nodes = renamed;
  if (state.guide.startNode === oldId) state.guide.startNode = newId;
  if (state.previewNodeId === oldId) state.previewNodeId = newId;
  markDirty();
  renderEditor();
  renderPreview();
}

function removeNode(nodeId) {
  if (!confirm(`Remove node "${nodeId}"?`)) return;
  delete state.guide.nodes[nodeId];
  Object.values(state.guide.nodes).forEach((node) => {
    if (node.successNext === nodeId) node.successNext = null;
    if (node.failNext === nodeId) node.failNext = null;
  });
  if (state.guide.startNode === nodeId) state.guide.startNode = Object.keys(state.guide.nodes)[0];
  if (state.previewNodeId === nodeId) state.previewNodeId = state.guide.startNode;
  markDirty();
  renderEditor();
  renderPreview();
}

function validateClient() {
  const errors = [];
  const guide = state.guide;
  if (!guide) return ["No guide is open."];
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(guide.id || "")) errors.push("Guide ID is invalid.");
  if (!String(guide.title || "").trim()) errors.push("Guide title is required.");
  if (!guide.nodes || !Object.keys(guide.nodes).length) errors.push("At least one node is required.");
  if (!guide.nodes[guide.startNode]) errors.push("The start node does not exist.");
  Object.entries(guide.nodes || {}).forEach(([id, node]) => {
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) errors.push(`Node ID "${id}" is invalid.`);
    if (!String(node.title || "").trim()) errors.push(`Node "${id}" needs a title.`);
    if (!Array.isArray(node.body) || !node.body.length) errors.push(`Node "${id}" needs body text.`);
    ["successNext", "failNext"].forEach((pointer) => {
      if (node[pointer] && !guide.nodes[node[pointer]]) errors.push(`Node "${id}" points to missing node "${node[pointer]}".`);
    });
    if (node.type !== "terminal") {
      if (!String(node.successLabel || "").trim()) errors.push(`Question "${id}" needs a positive answer label.`);
      if (!String(node.failLabel || "").trim()) errors.push(`Question "${id}" needs a negative answer label.`);
    }
  });
  return errors;
}

function showValidation(announce) {
  if (!hosts.validation || !state.guide) return;
  const errors = validateClient();
  hosts.validation.replaceChildren();
  const box = el("div", "validation-box");
  box.appendChild(el("h3", "", errors.length ? "Validation problems" : "Guide is valid"));
  if (errors.length) {
    const list = el("ul");
    errors.forEach((error) => list.appendChild(el("li", "", error)));
    box.appendChild(list);
  } else {
    box.appendChild(el("p", "", "All node links and required fields look correct."));
  }
  hosts.validation.appendChild(box);
  if (announce) showStatus(errors.length ? errors.join("\n") : "Guide validation passed.", errors.length ? "error" : "success");
}

function renderPreview() {
  const pane = hosts.previewPane;
  pane.replaceChildren();
  pane.appendChild(el("h2", "pane-title", "Live Preview"));
  if (!state.guide) {
    pane.appendChild(el("p", "empty-message", "Choose or create a guide."));
    return;
  }
  const nodeId = state.previewNodeId && state.guide.nodes[state.previewNodeId] ? state.previewNodeId : state.guide.startNode;
  const node = state.guide.nodes[nodeId];
  if (!node) {
    pane.appendChild(el("p", "dt-error", "The preview node does not exist."));
    return;
  }
  state.previewNodeId = nodeId;
  const card = el("div", "preview-card");
  card.appendChild(el("h3", "dt-title", node.title || nodeId));
  const body = el("div", "dt-body");
  (node.body || []).forEach((line) => body.appendChild(el("p", "", line)));
  card.appendChild(body);
  if (node.type !== "terminal") {
    const actions = el("div", "dt-actions");
    const success = el("button", "dt-button btn-success", node.successLabel || "Yes");
    success.type = "button";
    success.disabled = !node.successNext;
    success.addEventListener("click", () => {
      state.previewNodeId = node.successNext;
      renderPreview();
    });
    const fail = el("button", "dt-button btn-fail", node.failLabel || "No");
    fail.type = "button";
    fail.disabled = !node.failNext;
    fail.addEventListener("click", () => {
      state.previewNodeId = node.failNext;
      renderPreview();
    });
    actions.append(success, fail);
    card.appendChild(actions);
  }
  const reset = el("button", "btn-start-over", "Start Over");
  reset.type = "button";
  reset.addEventListener("click", () => {
    state.previewNodeId = state.guide.startNode;
    renderPreview();
  });
  card.appendChild(reset);
  pane.appendChild(card);
  pane.appendChild(el("p", "editor-footer-note", `Previewing node: ${nodeId}`));
}

async function loadIndex() {
  const data = await requestJson("../api/editor/guides");
  state.categories = data.categories || [];
  renderGuideList();
}

async function loadGuide(guideId) {
  if (state.dirty && !confirm("Discard unsaved changes?")) return;
  showStatus("Loading guide…");
  try {
    const data = await requestJson(`../api/editor/guides/${encodeURIComponent(guideId)}`);
    state.guide = clone(data.guide);
    state.categoryId = data.categoryId;
    state.selectedId = guideId;
    state.originalId = guideId;
    state.previewNodeId = state.guide.startNode;
    state.editingMode = true;
    state.dirty = false;
    renderGuideList();
    renderEditor();
    renderPreview();
    showStatus("");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

function newGuide() {
  if (state.dirty && !confirm("Discard unsaved changes?")) return;
  state.guide = emptyGuide();
  state.categoryId = state.categories[0]?.id || "";
  state.selectedId = "";
  state.originalId = "";
  state.previewNodeId = state.guide.startNode;
  state.editingMode = true;
  state.dirty = false;
  renderGuideList();
  renderEditor();
  renderPreview();
  showStatus("New guide ready.");
}

async function saveGuide() {
  const errors = validateClient();
  if (errors.length) {
    showValidation(true);
    return;
  }
  showStatus("Saving guide…");
  try {
    const result = await requestJson("../api/editor/guides", {
      method: "POST",
      body: JSON.stringify({
        originalId: state.originalId,
        categoryId: selectedCategoryId(),
        guide: state.guide
      })
    });
    state.originalId = result.guideId;
    state.selectedId = result.guideId;
    state.dirty = false;
    await loadIndex();
    renderEditor();
    showStatus("Guide saved successfully.", "success");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function deleteGuide() {
  if (!state.originalId || !confirm(`Delete "${state.guide.title}"? A backup will be kept.`)) return;
  showStatus("Deleting guide…");
  try {
    await requestJson(`../api/editor/guides/${encodeURIComponent(state.originalId)}`, { method: "DELETE" });
    state.guide = null;
    state.originalId = "";
    state.selectedId = "";
    state.editingMode = false;
    state.dirty = false;
    await loadIndex();
    renderEditor();
    renderPreview();
    showStatus("Guide deleted. A backup was retained.", "success");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

async function init() {
  buildShell();
  initTheme();
  renderEditor();
  renderPreview();
  showStatus("Loading guides…");
  try {
    await loadIndex();
    showStatus("");
  } catch (error) {
    showStatus(error.message, "error");
  }
}

init();
