// BUILD
/** Provides a shared no-op pane destroy contract */
export const NOOP_PANE = Object.freeze({ destroy() {} });

/** Creates a DOM element with optional class and text */
export function el(tag, cls = "", text = "") {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null && text !== "") node.textContent = String(text);
  return node;
}


/** Clears a host element and returns it */
export function clearHost(host) {
  host.replaceChildren();
  return host;
}


/** Applies a list of CSS classes to a host element */
export function addHostClasses(host, classes) {
  (classes || []).forEach((name) => {
    if (name) host.classList.add(name);
  });
  return host;
}


/** Renders a message into a host element */
export function renderHostMessage(host, message, className, replace = true, tag = "div") {
  if (replace) clearHost(host);
  const box = el(tag, className, message);
  host.appendChild(box);
  return box;
}


/** Renders a host title element */
export function renderHostTitle(host, title, className = "pane-title") {
  const heading = el("h2", className, title);
  host.appendChild(heading);
  return heading;
}


/** Renders an array of text as nothing, a paragraph, or a list */
export function renderTextArray(host, items, className = "", listClassName = className) {
  const values = Array.isArray(items) ? items : [];
  if (!values.length) return null;
  if (values.length === 1) {
    const paragraph = document.createElement("p");
    if (className) paragraph.className = className;
    paragraph.textContent = values[0];
    host.appendChild(paragraph);
    return paragraph;
  }
  const list = document.createElement("ul");
  if (listClassName) list.className = listClassName;
  values.forEach(function (item) {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.appendChild(listItem);
  });
  host.appendChild(list);
  return list;
}


/** Converts a value to display title case */
export function titleCase(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, function (match) {
      return match.toUpperCase();
    })
    .trim();
}
