// IMPORTS
import { el } from "../../../js/core/helpers.js";
import { hosts } from "./editorState.js";

// STATE
const APP_CLASS = "app editor-app";
const HEADER_CLASS = "header-centered";
const MAIN_CLASS = "split";
const MAIN_ID = "root";
const PAGE_TITLE_ID = "pageTitle";
const PAGE_TITLE = "IT Guide Editor";
const THEME_TOGGLE_WRAPPER_CLASS = "theme-toggle-wrapper";
const THEME_TOGGLE_CLASS = "theme-toggle";
const THEME_TOGGLE_ICON_CLASS = "theme-toggle-icon";
const THEME_TOGGLE_TEXT_CLASS = "theme-toggle-text";
const NAV_CLASS = "nav";
const NAV_LINKS_CLASS = "nav-links";
const NAV_ITEMS = [
  { key: "public", label: "Public Site", href: "../index.html" },
  { key: "editor", label: "Guide Editor", href: "./" }
];

// BUILD
/** Creates the shell theme toggle button */
function createThemeToggle() {
  const wrapper = el("div", THEME_TOGGLE_WRAPPER_CLASS);
  const button = el("button", THEME_TOGGLE_CLASS);
  button.type = "button";
  button.setAttribute("aria-label", "Toggle light/dark mode");
  button.setAttribute("aria-pressed", "false");
  button.title = "Toggle light/dark mode";
  button.append(el("span", THEME_TOGGLE_ICON_CLASS, "☾"), el("span", THEME_TOGGLE_TEXT_CLASS, "Theme"));
  wrapper.appendChild(button);
  return wrapper;
}


/** Creates the shell navigation for the active page */
function createNav(activeNavKey) {
  const nav = el("nav", NAV_CLASS);
  nav.setAttribute("aria-label", "Editor navigation");
  const links = el("div", NAV_LINKS_CLASS);
  NAV_ITEMS.forEach(function (item) {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    if (activeNavKey === item.key) link.setAttribute("aria-current", "page");
    links.appendChild(link);
  });
  nav.appendChild(links);
  return nav;
}


/** Builds the editor shell and mounts it into the app root */
export function buildEditorAppShell({ pageTitle, activeNavKey }) {
  const appRoot = el("div", APP_CLASS);
  const header = el("header", HEADER_CLASS);
  const heading = el("h1", "", pageTitle || PAGE_TITLE);
  heading.id = PAGE_TITLE_ID;
  const themeHost = createThemeToggle();
  const nav = createNav(activeNavKey);
  header.appendChild(heading);
  header.appendChild(themeHost);
  header.appendChild(nav);

  const statusHost = el("div", "status-container");
  const main = el("main", MAIN_CLASS);
  main.id = MAIN_ID;
  const listPane = el("section", "pane editor-list-pane");
  const editPane = el("section", "pane editor-main-pane");
  const decisionTreePane = el("section", "pane editor-preview-pane pane-host--decision-tree");
  main.append(listPane, editPane, decisionTreePane);

  appRoot.append(header, statusHost, main);
  const root = document.getElementById("app");
  if (!root) throw new Error("Missing #app root");
  root.replaceChildren(appRoot);
  Object.assign(hosts, { status: statusHost, listPane, editPane, decisionTreePane, contentHost: main });
  return { appRoot, header, main, nav, themeHost, statusHost, contentHost: main };
}
