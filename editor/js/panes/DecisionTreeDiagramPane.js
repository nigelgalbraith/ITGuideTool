// IMPORTS
import {
  clearHost,
  addHostClasses,
  renderHostMessage,
  renderHostTitle
} from "../../../js/core/helpers.js";
import { buildDecisionTreeMermaid } from "../../../js/core/decisionTreeUtils.js";
import { renderMermaidElement } from "../core/mermaidLoader.js";

// STATE
const DIAGRAM_CLASS = "pane-host--decision-tree-diagram";

// BUILD
/** Renders Mermaid syntax into the diagram host */
function renderMermaid(host, syntax, isCurrent = function () { return true; }) {
  const loading = document.createElement("div");
  loading.className = "dt-diagram-loading";
  loading.textContent = "Loading flowchart...";
  host.appendChild(loading);
  const diagram = document.createElement("div");
  diagram.className = "mermaid dt-diagram-canvas";
  diagram.hidden = true;
  diagram.textContent = syntax;
  host.appendChild(diagram);
  renderMermaidElement(diagram)
    .then(function () {
      if (!isCurrent()) return;
      loading.remove();
      diagram.hidden = false;
    })
    .catch(function () {
      if (!isCurrent()) return;
      loading.remove();
      diagram.remove();
      renderHostMessage(host, "Unable to render decision tree diagram.", "dt-diagram-error", false);
    });
}


/** Initializes the decision tree diagram pane */
function initDecisionTreeDiagramPane(host, settings) {
  const decisionTree = settings.guide || null;
  const isCurrent = settings.isCurrent || function () { return true; };
  clearHost(host);
  renderHostTitle(host, settings.title || "Guide Flowchart", "dt-diagram-title");
  if (!decisionTree) {
    renderHostMessage(host, "Guide not found.", "dt-diagram-error", false);
    return { destroy() {} };
  }
  renderMermaid(host, buildDecisionTreeMermaid(decisionTree), isCurrent);
  return { destroy() {} };
}


/** Builds the decision tree diagram pane host */
export function buildDecisionTreeDiagramPane(options) {
  const settings = options || {};
  const node = document.createElement("div");
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", DIAGRAM_CLASS, "pane"]);
  const instance = initDecisionTreeDiagramPane(node, settings);
  return { node, destroy: instance.destroy };
}


/** Renders the live decision tree diagram preview pane */
export function renderDecisionTreeDiagramPane({ state, hosts }) {
  const contentHost = hosts.contentHost;
  const existingPane = hosts.decisionTreeDiagramPane;
  if (existingPane) existingPane.remove();
  hosts.decisionTreeDiagramRenderId = (hosts.decisionTreeDiagramRenderId || 0) + 1;
  const renderId = hosts.decisionTreeDiagramRenderId;
  if (!state.guide) {
    const emptyPane = document.createElement("div");
    emptyPane.className = "pane";
    renderHostTitle(emptyPane, "Decision Tree Diagram Preview", "pane-title");
    renderHostMessage(emptyPane, "Choose or create a guide.", "empty-message", false, "p");
    hosts.decisionTreeDiagramPane = emptyPane;
    contentHost.appendChild(emptyPane);
    return;
  }
  const flowchartPane = buildDecisionTreeDiagramPane({
    guide: state.guide,
    title: "Decision Tree Diagram Preview",
    isCurrent: function () {
      return hosts.decisionTreeDiagramRenderId === renderId;
    }
  });
  hosts.decisionTreeDiagramPane = flowchartPane.node;
  contentHost.appendChild(flowchartPane.node);
}
