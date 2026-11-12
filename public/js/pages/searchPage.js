
 // IMPORTS
import { createPageRuntime } from "../core/pageRuntime.js";
import { el } from "../core/helpers.js";
import { loadGuideRegistry, loadGuidesForCategory } from "../core/guideData.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildIntroCardPane } from "../panes/IntroCardPane.js";
import { buildFooterPane } from "../panes/FooterPane.js";

// BUILD
/** Returns guides matching the search text */
function filterGuides(guides, query) {
  const search = query.trim().toLowerCase();
  if (!search) return guides;
  return guides.filter(function (guide) {
    const title = guide.title || "";
    const description = Array.isArray(guide.cardText) ? guide.cardText.join(" ") : "";
    return (title + " " + description).toLowerCase().includes(search);
  });
}


/** Initializes the search page */
export async function initSearchPage() {
  const { lifecycle, shell } = createPageRuntime({
    pageTitle: "Search Guides",
    activeNavKey: "search"
  });
  const section = el("section", "intro-hero");
  const searchInput = el("input", "search-input");
  searchInput.type = "search";
  searchInput.placeholder = "Search guides...";
  searchInput.setAttribute("aria-label", "Search guides");
  const resultsHost = el("div", "search-results");
  section.append(searchInput, resultsHost);
  shell.contentHost.appendChild(section);
  const footerPane = buildFooterPane();
  shell.appRoot.appendChild(footerPane.node);
  lifecycle.add(footerPane.destroy);
  resultsHost.appendChild(el("p", "intro-text", "Loading guides..."));
  try {
    const registry = await loadGuideRegistry();
    const search = registry.search || {};
    const categories = registry.categories || [];
    const heading = shell.header.querySelector("#pageTitle");
    if (heading) heading.textContent = search.title || "Search Guides";
    document.title = search.title || "Search Guides";
    const introPane = buildIntroPane({
      text: search.intro || [],
      className: "intro-text"
    });
    section.prepend(introPane.node);
    lifecycle.add(introPane.destroy);
    const guideGroups = await Promise.all(categories.map(loadGuidesForCategory));
    const guides = guideGroups.flat();
    function renderResults() {
      const matches = filterGuides(guides, searchInput.value);
      if (!matches.length) {
        resultsHost.replaceChildren(el("p", "intro-text", "No matching guides found."));
        return;
      }
      const cardPane = buildIntroCardPane({
        guides: matches,
        className: "intro-card-grid"
      });
      resultsHost.replaceChildren(cardPane.node);
    }
    searchInput.addEventListener("input", renderResults);
    renderResults();
  } catch (error) {
    console.error("Unable to load guides:", error);
    resultsHost.replaceChildren(el("p", "intro-text", "Unable to load guides."));
  }
}
