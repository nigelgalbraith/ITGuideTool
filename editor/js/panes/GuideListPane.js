// IMPORTS
import { el } from "../../../js/core/helpers.js";

// BUILD
/** Renders the guide list pane */
export function renderGuideListPane({ state, hosts, actions }) {
  const pane = hosts.listPane;
  pane.replaceChildren();
  pane.classList.toggle("editing-mode", state.editingMode);

  const browser = el("div", `guide-browser${state.editingMode ? " hidden" : ""}`);
  const toolbar = el("div", "editor-toolbar editor-toolbar--centered");
  toolbar.appendChild(el("h2", "", "Guides"));
  const toolbarActions = el("div", "centered-actions");
  const newButton = el("button", "editor-button-success", "New Guide");
  newButton.type = "button";
  newButton.addEventListener("click", actions.newGuide);
  toolbarActions.appendChild(newButton);
  toolbar.appendChild(toolbarActions);
  browser.appendChild(toolbar);

  const list = el("div", "guide-list");
  state.categories.forEach((category) => {
    if (!category.guides.length) return;
    const heading = el("h3", "", category.title);
    list.appendChild(heading);
    category.guides.forEach((guide) => {
      const button = el("button", "guide-list-item");
      button.type = "button";
      button.setAttribute("aria-current", String(guide.id === state.selectedId));
      button.append(el("span", "", guide.title), el("span", "node-badge", guide.id));
      button.addEventListener("click", () => actions.loadGuide(guide.id));
      list.appendChild(button);
    });
  });
  if (!list.children.length) list.appendChild(el("p", "empty-message", "No guides found."));
  browser.appendChild(list);

  const editingHeader = el("div", `guide-editing-header centered-actions${state.editingMode ? "" : " hidden"}`);
  const backButton = el("button", "", "← Back to Guides");
  backButton.type = "button";
  backButton.addEventListener("click", actions.backToGuides);
  editingHeader.appendChild(backButton);

  pane.append(browser, editingHeader);
}
