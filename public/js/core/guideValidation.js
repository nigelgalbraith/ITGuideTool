// BUILD
/** Returns whether a value is a plain object */
function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}


/** Adds a reference validation error when a next pointer is invalid */
function validateNextReference(errors, nodes, nodeId, property) {
  const node = nodes[nodeId] || {};
  const nextNodeId = node[property];
  if (nextNodeId === undefined || nextNodeId === null) return;
  if (!Object.prototype.hasOwnProperty.call(nodes, nextNodeId)) {
    errors.push("Node \"" + nodeId + "\" has invalid " + property + " reference \"" + nextNodeId + "\".");
  }
}


/** Validates guide data before rendering guide panes */
export function validateGuideData(guide) {
  const errors = [];
  if (!isPlainObject(guide)) {
    return ["Guide data is missing or invalid."];
  }
  const nodes = isPlainObject(guide.nodes) ? guide.nodes : null;
  if (!nodes) {
    errors.push("Guide is missing a valid nodes object.");
  }
  if (!Object.prototype.hasOwnProperty.call(guide, "startNode") || !String(guide.startNode || "").trim()) {
    errors.push("Guide is missing startNode.");
  } else if (nodes && !Object.prototype.hasOwnProperty.call(nodes, guide.startNode)) {
    errors.push("startNode references missing node \"" + guide.startNode + "\".");
  }
  if (!nodes) return errors;
  Object.keys(nodes).forEach(function (nodeId) {
    const node = nodes[nodeId];
    if (!String(nodeId || "").trim()) {
      errors.push("A node is missing an id.");
    }
    if (!isPlainObject(node)) {
      errors.push("Node \"" + nodeId + "\" must be an object.");
      return;
    }
    if (node.id !== undefined && node.id !== nodeId) {
      errors.push("Node \"" + nodeId + "\" has mismatched id \"" + node.id + "\".");
    }
    if (!Object.prototype.hasOwnProperty.call(node, "title") || !String(node.title || "").trim()) {
      errors.push("Node \"" + nodeId + "\" is missing title.");
    }
    if (!Object.prototype.hasOwnProperty.call(node, "body")) {
      errors.push("Node \"" + nodeId + "\" is missing body.");
    } else if (!Array.isArray(node.body)) {
      errors.push("Node \"" + nodeId + "\" body must be a list.");
    } else {
      node.body.forEach(function (item, index) {
        if (typeof item !== "string") {
          errors.push("Node \"" + nodeId + "\" body item " + (index + 1) + " must be text.");
        }
      });
    }
    validateNextReference(errors, nodes, nodeId, "successNext");
    validateNextReference(errors, nodes, nodeId, "failNext");
  });
  return errors;
}
