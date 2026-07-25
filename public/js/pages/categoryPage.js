import { createPageRuntime } from "../core/pageRuntime.js";
import { el } from "../core/helpers.js";
import {
  findCategoryEntry,
  loadGuideIndex,
  loadGuidesForCategory
} from "../core/guideData.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildIntroCardPane } from "../panes/IntroCardPane.js";
import { buildFooterPane } from "../panes/FooterPane.js";

// STATE
const BASE_TITLE = "IT How-To Guide";
const BACK_NAV_KEY = "home";

// BUILD
/** Reads the current category key from the URL */
function getCategoryKey() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("category") || "").trim();
}


/** Builds the shared category message host */
function buildCategoryMessageHost() {
  const host = document.createElement("div");
  host.className = "intro-text";
  host.id = "introHost";
  return host;
}


/** Renders the missing category URL parameter message */
function renderMissingParamMessage(host) {
  const paragraph = document.createElement("p");
  paragraph.appendChild(document.createTextNode("Missing required URL parameter: "));
  paragraph.appendChild(el("code", "", "?category="));
  host.appendChild(paragraph);
}


/** Appends the footer pane after the main page content */
function appendFooter(shell, lifecycle) {
  const footerPane = buildFooterPane();
  shell.appRoot.appendChild(footerPane.node);
  lifecycle.add(footerPane.destroy);
}


/** Builds the selected category introduction content */
function buildCategoryIntroPane(category) {
  const introPane = buildIntroPane({
    text: category.description || "",
    className: "intro-text"
  });
  const introItems = Array.isArray(category.intro) ? category.intro : [];
  introItems.forEach(function (text) {
    introPane.node.appendChild(el("p", "", text));
  });
  return introPane;
}


/** Initializes the category page orchestrator */
export async function initCategoryPage() {
  const { lifecycle, shell } = createPageRuntime({
    pageTitle: BASE_TITLE,
    activeNavKey: BACK_NAV_KEY
  });
  const categoryId = getCategoryKey();
  const heading = shell.header.querySelector("#pageTitle");
  if (!categoryId) {
    const introHost = buildCategoryMessageHost();
    renderMissingParamMessage(introHost);
    shell.contentHost.appendChild(introHost);
    document.title = BASE_TITLE;
    appendFooter(shell, lifecycle);
    return;
  }
  let category = null;
  try {
    const guideIndex = await loadGuideIndex();
    category = findCategoryEntry(guideIndex, categoryId);
  } catch (error) {
    console.warn("Unable to load guide categories:", error);
  }
  if (!category) {
    const introHost = buildCategoryMessageHost();
    introHost.appendChild(el("p", "", "Category not found."));
    shell.contentHost.appendChild(introHost);
    document.title = BASE_TITLE;
    appendFooter(shell, lifecycle);
    return;
  }
  const displayName = category.title || category.id || BASE_TITLE;
  const guides = await loadGuidesForCategory(category);
  if (heading) heading.textContent = displayName;
  document.title = displayName;
  const introSection = document.createElement("section");
  introSection.className = "intro-hero";
  const introPane = buildCategoryIntroPane(category);
  const cardPane = buildIntroCardPane({ guides, className: "intro-card-grid" });
  introSection.appendChild(introPane.node);
  introSection.appendChild(cardPane.node);
  shell.contentHost.appendChild(introSection);
  appendFooter(shell, lifecycle);
  lifecycle.add(introPane.destroy);
  lifecycle.add(cardPane.destroy);
}
