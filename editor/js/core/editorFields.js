// IMPORTS
import { el } from "../../../js/core/helpers.js";
import { state } from "./editorState.js";

// BUILD
/** Creates a labelled form field */
export function createField(labelText, input, wide = false, help = "") {
  const wrapper = el("div", `form-field${wide ? " form-field--wide" : ""}`);
  const label = el("label", "", labelText);
  if (!input.id) input.id = `field-${Math.random().toString(36).slice(2)}`;
  label.htmlFor = input.id;
  wrapper.append(label, input);
  if (help) wrapper.appendChild(el("p", "field-help", help));
  return wrapper;
}


/** Creates a text-like input */
export function makeInput(value, onChange, type = "text") {
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  input.addEventListener("input", () => onChange(input.value));
  return input;
}


/** Creates a textarea input */
export function makeTextarea(value, onChange) {
  const input = document.createElement("textarea");
  input.value = value ?? "";
  input.addEventListener("input", () => onChange(input.value));
  return input;
}


/** Creates a node destination selector */
export function destinationSelect(value, currentNodeId, onChange) {
  const select = document.createElement("select");
  select.appendChild(new Option("End guide", ""));
  Object.keys(state.guide.nodes).forEach((nodeId) => {
    select.appendChild(new Option(nodeId === currentNodeId ? `${nodeId} (this node)` : nodeId, nodeId));
  });
  select.value = value || "";
  select.addEventListener("change", () => onChange(select.value || null));
  return select;
}
