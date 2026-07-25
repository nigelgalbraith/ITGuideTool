// IMPORTS
import { el } from "../../../js/core/helpers.js";
import { buildGuideImage } from "../core/imageLoader.js";

// BUILD
/** Renders the current node image when configured */
function renderNodeImage(host, node) {
  if (!node || !node.image) return;
  const image = buildGuideImage(node.image, node.alt, node.caption);
  if (image) host.appendChild(image);
}


/** Renders the current node alt text when configured */
function renderNodeAltText(host, node) {
  const altText = String(node && node.alt || "").trim();
  if (altText) host.appendChild(el("p", "editor-footer-note", "Alt text: " + altText));
}


/** Renders the current node preview pane */
export function renderDecisionTreePane({ state, hosts, actions }) {
  const pane = hosts.decisionTreePane;
  pane.replaceChildren();
  pane.appendChild(el("h2", "pane-title", "Node Preview"));
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
  renderNodeImage(card, node);
  renderNodeAltText(card, node);
  if (node.type !== "terminal") {
    const previewActions = el("div", "dt-actions");
    const success = el("button", "dt-button btn-success", node.successLabel || "Yes");
    success.type = "button";
    success.disabled = !node.successNext;
    success.addEventListener("click", () => {
      state.previewNodeId = node.successNext;
      actions.renderPreview();
    });
    const fail = el("button", "dt-button btn-fail", node.failLabel || "No");
    fail.type = "button";
    fail.disabled = !node.failNext;
    fail.addEventListener("click", () => {
      state.previewNodeId = node.failNext;
      actions.renderPreview();
    });
    previewActions.append(success, fail);
    card.appendChild(previewActions);
  }
  const resetActions = el("div", "dt-actions");
  const reset = el("button", "btn-start-over", "Start Over");
  reset.type = "button";
  reset.addEventListener("click", () => {
    state.previewNodeId = state.guide.startNode;
    actions.renderPreview();
  });
  resetActions.appendChild(reset);
  card.appendChild(resetActions);
  pane.appendChild(card);
  pane.appendChild(el("p", "editor-footer-note", `Previewing node: ${nodeId}`));
}
