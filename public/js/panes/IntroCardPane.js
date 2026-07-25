// IMPORTS
import { NOOP_PANE, addHostClasses, el, renderHostMessage, renderTextArray } from "../core/helpers.js";

// STATE
const CARDS_CLASS = "intro-card-grid";

// BUILD
/** Gets the display guide count for a category */
function getGuideCountText(category) {
  const count = category && Array.isArray(category.guides) ? category.guides.length : 0;
  return count + " " + (count === 1 ? "guide" : "guides");
}


/** Gets guide card content as text blocks */
function getGuideCardText(guide) {
  return Array.isArray(guide.cardText) ? guide.cardText : [];
}


/** Builds one category card element */
function buildCategoryCard(category) {
  const card = el("div", "intro-card");
  const link = document.createElement("a");
  link.href = "?page=category&category=" + encodeURIComponent(category.id || "");
  link.appendChild(el("h2", "", category.title || category.id || ""));
  renderTextArray(link, [category.description || "", getGuideCountText(category)].filter(Boolean));
  card.appendChild(link);
  return card;
}


/** Builds one guide card element */
function buildGuideCard(guide) {
  const card = el("div", "intro-card");
  const link = document.createElement("a");
  link.href = "index.html?page=guide&guide=" + encodeURIComponent(guide.id || "");
  link.appendChild(el("h2", "", guide.title || guide.id || ""));
  renderTextArray(link, getGuideCardText(guide));
  card.appendChild(link);
  return card;
}


/** Initializes the intro cards pane node */
function initIntroCardsPane(host, settings) {
  const categories = settings.categories || [];
  const guides = settings.guides || [];
  if (categories.length) {
    categories.forEach(function (category) {
      if (category) host.appendChild(buildCategoryCard(category));
    });
    return NOOP_PANE;
  }
  if (guides.length) {
    guides.forEach(function (guide) {
      if (guide) host.appendChild(buildGuideCard(guide));
    });
    return NOOP_PANE;
  }
  if (settings.categories) {
    renderHostMessage(host, "No categories configured.", "", true, "p");
  } else {
    renderHostMessage(host, "No guides configured.", "", true, "p");
  }
  return NOOP_PANE;
}


/** Builds the intro cards pane */
export function buildIntroCardPane(options) {
  const settings = options || {};
  const node = document.createElement("div");
  node.className = settings.className || CARDS_CLASS;
  if (settings.id) node.id = settings.id;
  addHostClasses(node, ["pane-host", "pane-host--intro-cards"]);
  const instance = initIntroCardsPane(node, settings);
  return { node, destroy: instance.destroy };
}
