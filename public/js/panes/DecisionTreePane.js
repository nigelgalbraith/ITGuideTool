// IMPORTS
import {
  el,
  clearHost,
  addHostClasses,
  renderHostMessage,
  renderHostTitle,
  renderTextArray
} from "../core/helpers.js";
import { getBranchLabel, isTerminalNode } from "../core/decisionTreeUtils.js";
import { buildGuideImage } from "../core/imageLoader.js";

// STATE
const DECISION_TREE_CLASS = "pane-host--decision-tree";

// BUILD
/** Gets the configured node by id */
function getNode(decisionTree, nodeId) {
  if (!decisionTree || !decisionTree.nodes || !nodeId) return null;
  return decisionTree.nodes[nodeId] || null;
}


/** Resolves the first node id for a decision tree */
function getStartNodeId(decisionTree) {
  if (!decisionTree || !decisionTree.nodes) return "";
  if (decisionTree.startNode) return decisionTree.startNode;
  return Object.keys(decisionTree.nodes)[0] || "";
}


/** Renders the completion message */
function renderEnd(host, onStartOver) {
  clearHost(host);
  renderHostTitle(host, "Completed", "dt-title");
  renderHostMessage(host, "This guide is complete.", "dt-body", false, "p");
  const actions = el("div", "dt-actions");
  const startOverButton = document.createElement("button");
  startOverButton.type = "button";
  startOverButton.className = "dt-button btn-start-over";
  startOverButton.textContent = "Start Over";
  startOverButton.addEventListener("click", onStartOver);
  actions.appendChild(startOverButton);
  host.appendChild(actions);
  return {
    destroy() {
      startOverButton.removeEventListener("click", onStartOver);
    }
  };
}


/** Renders node body content as plain text */
function renderNodeBody(host, body) {
  return renderTextArray(host, body, "dt-body", "dt-body dt-body-list");
}


/** Renders an optional node image */
function renderNodeImage(host, node) {
  if (!node || !node.image) return null;
  const image = buildGuideImage(node.image, node.alt, node.caption);
  if (image) host.appendChild(image);
  return image;
}


/** Renders a decision tree node */
function renderNode(host, node, history, onBack, onSuccess, onFail, onStartOver) {
  clearHost(host);
  renderHostTitle(host, node.title || "Node", "dt-title");
  renderNodeBody(host, node.body);
  renderNodeImage(host, node);
  const actions = el("div", "dt-actions");
  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "dt-button btn-back";
  backButton.textContent = "Back";
  backButton.disabled = !history.length;
  backButton.addEventListener("click", onBack);
  actions.appendChild(backButton);
  if (isTerminalNode(node)) {
    const startOverButton = document.createElement("button");
    startOverButton.type = "button";
    startOverButton.className = "dt-button btn-start-over";
    startOverButton.textContent = "Start Over";
    startOverButton.addEventListener("click", onStartOver);
    actions.appendChild(startOverButton);
    host.appendChild(actions);
    return {
      destroy() {
        backButton.removeEventListener("click", onBack);
        startOverButton.removeEventListener("click", onStartOver);
      }
    };
  }
  const successButton = document.createElement("button");
  const failButton = document.createElement("button");
  successButton.type = "button";
  failButton.type = "button";
  successButton.className = "dt-button btn-success";
  failButton.className = "dt-button btn-fail";
  successButton.textContent = getBranchLabel(node, "success");
  failButton.textContent = getBranchLabel(node, "fail");
  successButton.addEventListener("click", onSuccess);
  failButton.addEventListener("click", onFail);
  actions.appendChild(successButton);
  actions.appendChild(failButton);
  host.appendChild(actions);
  return {
    destroy() {
      backButton.removeEventListener("click", onBack);
      successButton.removeEventListener("click", onSuccess);
      failButton.removeEventListener("click", onFail);
    }
  };
}


/** Initializes the decision tree pane */
function initDecisionTreePane(host, settings) {
  const decisionTree = settings.guide || null;
  let cleanup = null;
  let currentNodeId = "";
  const history = [];
  if (!decisionTree) {
    renderHostMessage(host, "Guide not found.", "dt-error", true);
    return { destroy() {} };
  }
  function showNode(nodeId) {
    const node = getNode(decisionTree, nodeId);
    if (cleanup && cleanup.destroy) cleanup.destroy();
    cleanup = null;
    if (!node) {
      cleanup = renderEnd(host, function () {
        history.length = 0;
        showNode(getStartNodeId(decisionTree));
      });
      return;
    }
    currentNodeId = nodeId;
    cleanup = renderNode(host, node, history, function () {
      const previousNodeId = history.pop();
      if (previousNodeId) showNode(previousNodeId);
    }, function () {
      history.push(currentNodeId);
      showNode(node.successNext);
    }, function () {
      history.push(currentNodeId);
      showNode(node.failNext);
    }, function () {
      history.length = 0;
      showNode(getStartNodeId(decisionTree));
    });
  }
  showNode(getStartNodeId(decisionTree));
  return {
    destroy() {
      if (cleanup && cleanup.destroy) cleanup.destroy();
    }
  };
}


/** Builds the decision tree pane host */
export function buildDecisionTreePane(options) {
  const settings = options || {};
  const node = document.createElement("div");
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", DECISION_TREE_CLASS, "pane"]);
  const instance = initDecisionTreePane(node, settings);
  return { node, destroy: instance.destroy };
}
