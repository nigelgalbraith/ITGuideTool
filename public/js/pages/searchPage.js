
// IMPORTS
import { createPageRuntime } from "../core/pageRuntime.js";
import { el } from "../core/helpers.js";
import { loadGuideRegistry, loadGuidesForCategory } from "../core/guideData.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildSearchPane } from "../panes/SearchPane.js";

// BUILD
/** Initializes the search page */
export async function initSearchPage() {
  const { lifecycle, shell } = createPageRuntime({
    pageTitle: "Search Guides",
    activeNavKey: "search"
  });
  const section = el("section", "intro-hero");
  shell.contentHost.appendChild(section);
  const loadingMessage = el("p", "intro-text", "Loading guides...");
  section.appendChild(loadingMessage);
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
    const searchPane = buildSearchPane({
      guides,
      placeholder: "Search guides...",
      ariaLabel: "Search guides"
    });
    loadingMessage.replaceWith(searchPane.node);
    lifecycle.add(searchPane.destroy);
  } catch (error) {
    console.error("Unable to load guides:", error);
    loadingMessage.textContent = "Unable to load guides.";
  }
}
