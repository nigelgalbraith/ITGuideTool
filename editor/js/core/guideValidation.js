// BUILD
/** Validates the current editor guide client-side */
export function validateClient(state) {
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
