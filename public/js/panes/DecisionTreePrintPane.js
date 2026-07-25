// IMPORTS
import {
  el,
  clearHost,
  addHostClasses,
  renderHostMessage,
  renderHostTitle
} from "../core/helpers.js";
import { buildPrintableGuideHtml } from "../core/decisionTreeUtils.js";

// STATE
const PRINT_CLASS = "pane-host--decision-tree-print";

// BUILD
/** Opens the printable guide in a clean print window */
function openPrintWindow(guide) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(buildPrintableGuideHtml(guide));
  printWindow.document.close();
  return true;
}


/** Initializes the decision tree print pane */
function initDecisionTreePrintPane(host, settings) {
  const decisionTree = settings.guide || null;
  clearHost(host);
  renderHostTitle(host, settings.title || "Printable Guide", "dt-print-title");
  if (!decisionTree) {
    renderHostMessage(host, "Guide not found.", "dt-print-error", false);
    return { destroy() {} };
  }
  const actions = el("div", "dt-print-actions");
  const printButton = document.createElement("button");
  printButton.type = "button";
  printButton.className = "dt-print-button";
  printButton.textContent = "Print / Save PDF";
  const onClick = function () {
    if (!openPrintWindow(decisionTree)) {
      renderHostMessage(host, "Allow pop-ups to open the print preview.", "dt-print-error", false);
    }
  };
  printButton.addEventListener("click", onClick);
  actions.appendChild(printButton);
  host.appendChild(actions);
  return {
    destroy() {
      printButton.removeEventListener("click", onClick);
    }
  };
}


/** Builds the decision tree print pane host */
export function buildDecisionTreePrintPane(options) {
  const settings = options || {};
  const node = document.createElement("div");
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", PRINT_CLASS, "pane"]);
  const instance = initDecisionTreePrintPane(node, settings);
  return { node, destroy: instance.destroy };
}
