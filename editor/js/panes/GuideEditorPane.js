// IMPORTS
import { el } from "../../../js/core/helpers.js";
import { createField, destinationSelect, makeInput, makeTextarea } from "../core/editorFields.js";
import { linesText, makeId, textLines } from "../core/guideData.js";

// BUILD
/** Renders the editor form pane */
export function renderGuideEditorPane({ state, hosts, actions }) {
  const pane = hosts.editPane;
  pane.replaceChildren();
  if (!state.guide) {
    pane.appendChild(el("p", "empty-message", "Choose a guide or create a new one."));
    return;
  }

  const toolbar = el("div", "editor-toolbar editor-toolbar--stacked");
  toolbar.appendChild(el("h2", "", state.originalId ? "Edit Guide" : "New Guide"));
  const editorActions = el("div", "editor-actions centered-actions");
  const validateButton = el("button", "", "Validate");
  validateButton.type = "button";
  validateButton.addEventListener("click", () => actions.showValidation(true));
  const saveButton = el("button", "editor-button-success", "Save Guide");
  saveButton.type = "button";
  saveButton.addEventListener("click", actions.saveGuide);
  editorActions.append(validateButton, saveButton);
  if (state.originalId) {
    const deleteButton = el("button", "editor-button-danger", "Delete");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", actions.deleteGuide);
    editorActions.appendChild(deleteButton);
  }
  toolbar.appendChild(editorActions);
  pane.appendChild(toolbar);

  const form = el("div", "editor-form");
  const details = el("div", "form-grid");

  const titleInput = makeInput(state.guide.title, (value) => {
    state.guide.title = value;
    if (!state.originalId && state.guide.id === "newGuide") state.guide.id = makeId(value);
    actions.markDirty();
    actions.renderEditor();
    actions.renderPreview();
  });
  details.appendChild(createField("Title", titleInput, true, "The title shown to users for this guide."));

  const idInput = makeInput(state.guide.id, (value) => {
    state.guide.id = value.trim();
    actions.markDirty();
  });
  details.appendChild(createField("Guide ID", idInput, true, "Used for the filename and URL. Example: cannotPrint."));

  const categorySelect = document.createElement("select");
  state.categories.forEach((category) => categorySelect.appendChild(new Option(category.title, category.id)));
  categorySelect.value = state.categoryId || state.categories[0]?.id || "";
  categorySelect.addEventListener("change", () => {
    state.categoryId = categorySelect.value;
    actions.markDirty();
  });
  hosts.categorySelect = categorySelect;
  details.appendChild(createField("Category", categorySelect, true, "The category this guide appears under."));

  const iconInput = makeInput(state.guide.icon || "", (value) => {
    state.guide.icon = value.trim();
    actions.markDirty();
  });
  details.appendChild(createField("Icon path", iconInput, true, "Optional. Leave blank if no icon is required."));

  const cardText = makeTextarea(linesText(state.guide.cardText), (value) => {
    state.guide.cardText = textLines(value);
    actions.markDirty();
  });
  details.appendChild(createField("Card description — one paragraph per line", cardText, true, "Short summary shown on the guide card. One paragraph per line."));

  const introText = makeTextarea(linesText(state.guide.text), (value) => {
    state.guide.text = textLines(value);
    actions.markDirty();
  });
  details.appendChild(createField("Guide introduction — one paragraph per line", introText, true, "Introductory text shown before the first question. One paragraph per line."));
  form.appendChild(details);

  const nodeToolbar = el("div", "editor-toolbar");
  nodeToolbar.appendChild(el("h2", "", "Nodes"));
  form.appendChild(nodeToolbar);

  const nodeList = el("div", "node-list");
  Object.entries(state.guide.nodes).forEach(([nodeId, node]) => nodeList.appendChild(renderNode({ state, actions, nodeId, node })));
  form.appendChild(nodeList);

  const questionActions = el("div", "centered-actions");
  const questionButton = el("button", "", "Add Node");
  questionButton.type = "button";
  questionButton.addEventListener("click", () => actions.addNode(false));
  questionActions.appendChild(questionButton);
  form.appendChild(questionActions);

  const validationHost = el("div", "");
  hosts.validation = validationHost;
  form.appendChild(validationHost);
  pane.appendChild(form);
  actions.showValidation(false);
}


/** Renders one guide node card */
function renderNode({ state, actions, nodeId, node }) {
  const card = el("article", `node-card${state.guide.startNode === nodeId ? " node-card--start" : ""}`);
  const heading = el("div", "node-heading");
  heading.append(el("h3", "", node.title || nodeId), el("span", "node-badge", node.type === "terminal" ? "Outcome" : "Question"));
  card.appendChild(heading);

  const grid = el("div", "form-grid");
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
    actions.markDirty();
    actions.renderEditor();
    actions.renderPreview();
  });
  grid.appendChild(createField("Node type", typeSelect, true, "Choose Question for a branching step or Outcome for a final result."));

  const idInput = makeInput(nodeId, (value) => actions.renameNode(nodeId, value.trim()));
  grid.appendChild(createField("Node ID", idInput, true, "Unique identifier for this node. Renaming updates links automatically."));

  const titleInput = makeInput(node.title || "", (value) => {
    node.title = value;
    actions.markDirty();
    actions.renderPreview();
  });
  grid.appendChild(createField("Title", titleInput, true, "The heading displayed for this question or outcome."));

  const bodyInput = makeTextarea(linesText(node.body), (value) => {
    node.body = textLines(value);
    actions.markDirty();
    actions.renderPreview();
  });
  grid.appendChild(createField("Body — one paragraph per line", bodyInput, true, "Main text shown to the user. One paragraph per line."));

  const imageInput = makeInput(node.image || "", (value) => {
    node.image = value.trim();
    actions.markDirty();
    actions.renderPreview();
  });
  grid.appendChild(createField("Image", imageInput, true, "Optional. Enter the relative path or URL of the image to display."));

  const altInput = makeInput(node.alt || "", (value) => {
    node.alt = value;
    actions.markDirty();
    actions.renderPreview();
  });
  grid.appendChild(createField("Alt text", altInput, true, "Optional. Describe the image for accessibility."));

  const captionInput = makeInput(node.caption || "", (value) => {
    node.caption = value;
    actions.markDirty();
    actions.renderPreview();
  });
  grid.appendChild(createField("Caption", captionInput, true, "Optional. Text displayed beneath the image."));
  card.appendChild(grid);

  if (node.type !== "terminal") {
    const answerSections = el("div", "answer-sections");

    const positiveSection = el("section", "answer-section answer-section--positive");
    positiveSection.appendChild(el("h4", "answer-section-title answer-section-title--positive", "Positive answer"));
    positiveSection.appendChild(createField("Answer label", makeInput(node.successLabel || "", (value) => {
      node.successLabel = value;
      actions.markDirty();
      actions.renderPreview();
    }), true, "Label shown for the positive/Yes option."));
    positiveSection.appendChild(createField("Goes to", destinationSelect(node.successNext, nodeId, (value) => {
      node.successNext = value;
      actions.markDirty();
      actions.renderPreview();
    }), true, "Select which node is shown when this answer is chosen."));

    const negativeSection = el("section", "answer-section answer-section--negative");
    negativeSection.appendChild(el("h4", "answer-section-title answer-section-title--negative", "Negative answer"));
    negativeSection.appendChild(createField("Answer label", makeInput(node.failLabel || "", (value) => {
      node.failLabel = value;
      actions.markDirty();
      actions.renderPreview();
    }), true, "Label shown for the negative/No option."));
    negativeSection.appendChild(createField("Goes to", destinationSelect(node.failNext, nodeId, (value) => {
      node.failNext = value;
      actions.markDirty();
      actions.renderPreview();
    }), true, "Select which node is shown when this answer is chosen."));

    answerSections.append(positiveSection, negativeSection);
    card.appendChild(answerSections);
  }

  const nodeActions = el("div", "node-actions");
  const startButton = el("button", "", state.guide.startNode === nodeId ? "Start Node" : "Make Start");
  startButton.type = "button";
  startButton.disabled = state.guide.startNode === nodeId;
  startButton.addEventListener("click", () => {
    state.guide.startNode = nodeId;
    state.previewNodeId = nodeId;
    actions.markDirty();
    actions.renderEditor();
    actions.renderPreview();
  });
  const removeButton = el("button", "editor-button-danger", "Remove Node");
  removeButton.type = "button";
  removeButton.disabled = Object.keys(state.guide.nodes).length <= 1;
  removeButton.addEventListener("click", () => actions.removeNode(nodeId));
  nodeActions.append(startButton, removeButton);
  card.appendChild(nodeActions);
  return card;
}
