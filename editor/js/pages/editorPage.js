// IMPORTS
import { el } from "../../../js/core/helpers.js";
import { createEditorPageRuntime } from "../core/pageRuntime.js";
import { renderDecisionTreeDiagramPane } from "../panes/DecisionTreeDiagramPane.js";
import { renderDecisionTreePane } from "../panes/DecisionTreePane.js";
import { buildFooterPane } from "../panes/FooterPane.js";
import { renderGuideEditorPane } from "../panes/GuideEditorPane.js";
import { renderGuideListPane } from "../panes/GuideListPane.js";
import { clone, emptyGuide, requestJson } from "../core/guideData.js";
import { hosts, state } from "../core/editorState.js";
import { validateClient } from "../core/guideValidation.js";

// STATE
const PAGE_TITLE = "IT Guide Editor";
const ACTIVE_NAV_KEY = "editor";

// BUILD
/** Appends the footer pane after the main page content */
function appendFooter(shell, lifecycle) {
  const footerPane = buildFooterPane();
  shell.appRoot.appendChild(footerPane.node);
  lifecycle.add(footerPane.destroy);
}


/** Renders a status message */
function showStatus(message, type = "") {
  hosts.status.replaceChildren();
  if (!message) return;
  const box = el("div", `status-message${type ? ` status-message--${type}` : ""}`);
  String(message).split("\n").forEach((line) => box.appendChild(el("div", "", line)));
  hosts.status.appendChild(box);
}


/** Marks the current guide as dirty */
function markDirty() {
  state.dirty = true;
  showStatus("Unsaved changes.");
}


/** Gets the selected category id */
function selectedCategoryId() {
  return hosts.categorySelect?.value || state.categories[0]?.id || "";
}


/** Renders the guide browser */
function renderGuideList() {
  renderGuideListPane({ state, hosts, actions });
}


/** Renders the guide editor */
function renderEditor() {
  renderGuideEditorPane({ state, hosts, actions });
}


/** Renders the guide preview */
function renderPreview() {
  renderDecisionTreePane({ state, hosts, actions });
  renderDecisionTreeDiagramPane({ state, hosts });
}


/** Returns from the editor form to the guide list */
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


/** Shows client-side validation results */
function showValidation(announce) {
  if (!hosts.validation || !state.guide) return;
  const errors = validateClient(state);
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


/** Creates a unique node id */
function uniqueNodeId(prefix) {
  let number = 1;
  let candidate = prefix;
  while (state.guide.nodes[candidate]) candidate = `${prefix}${number++}`;
  return candidate;
}


/** Adds a node to the current guide */
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


/** Renames a node and updates references to it */
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


/** Removes a node and clears links to it */
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


/** Loads the guide index */
async function loadIndex() {
  const data = await requestJson("../api/editor/guides");
  state.categories = data.categories || [];
  renderGuideList();
}


/** Loads one guide for editing */
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


/** Creates a new guide */
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


/** Saves the current guide */
async function saveGuide() {
  const errors = validateClient(state);
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


/** Deletes the current guide */
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


/** Handles unsaved changes before the page unloads */
window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

const actions = {
  addNode,
  backToGuides,
  deleteGuide,
  loadGuide,
  markDirty,
  newGuide,
  removeNode,
  renameNode,
  renderEditor,
  renderPreview,
  saveGuide,
  showValidation
};


/** Initializes the editor page orchestrator */
export async function initEditorPage() {
  const { lifecycle, shell } = createEditorPageRuntime({
    pageTitle: PAGE_TITLE,
    activeNavKey: ACTIVE_NAV_KEY
  });
  appendFooter(shell, lifecycle);
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
