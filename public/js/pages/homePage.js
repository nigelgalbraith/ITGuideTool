import { createPageRuntime } from "../core/pageRuntime.js";
import { loadGuideRegistry } from "../core/guideData.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildIntroCardPane } from "../panes/IntroCardPane.js";
import { buildFooterPane } from "../panes/FooterPane.js";

// BUILD
/** Gets fallback home content when the registry cannot be loaded */
function getFallbackHome() {
  return {
    title: document.title || "",
    intro: []
  };
}


/** Builds the home page intro section */
function buildHomeIntroSection(home, categories) {
  const introSection = document.createElement("section");
  introSection.className = "intro-hero";
  const introPane = buildIntroPane({ text: home.intro || [], className: "intro-text" });
  const cardPane = buildIntroCardPane({ categories, className: "intro-card-grid" });
  introSection.appendChild(introPane.node);
  introSection.appendChild(cardPane.node);
  return { node: introSection, destroy: function () {
    introPane.destroy();
    cardPane.destroy();
  } };
}


/** Initializes the home page orchestrator */
export async function initHomePage() {
  let home = getFallbackHome();
  const { lifecycle, shell } = createPageRuntime({
    pageTitle: home.title,
    activeNavKey: "home"
  });
  const loadingHost = document.createElement("div");
  loadingHost.className = "intro-text pane-host pane-host--intro-text pane pane-intro-text";
  loadingHost.appendChild(document.createElement("p")).textContent = "Loading guides...";
  shell.contentHost.appendChild(loadingHost);
  const footerPane = buildFooterPane();
  shell.appRoot.appendChild(footerPane.node);
  lifecycle.add(footerPane.destroy);
  try {
    const registry = await loadGuideRegistry();
    home = registry && registry.home ? registry.home : home;
    const categories = registry && Array.isArray(registry.categories) ? registry.categories : [];
    const heading = shell.header.querySelector("#pageTitle");
    if (heading) heading.textContent = home.title || document.title || "IT How-To Guide";
    document.title = home.title || document.title;
    const homeSection = buildHomeIntroSection(home, categories);
    shell.contentHost.replaceChildren(homeSection.node);
    lifecycle.add(homeSection.destroy);
  } catch (error) {
    console.error("Unable to load guide registry from data/guides.json:", error);
    const errorHost = document.createElement("div");
    errorHost.className = "intro-text pane-host pane-host--intro-text pane pane-intro-text";
    errorHost.appendChild(document.createElement("p")).textContent = "Unable to load guides. Please check the guide files and try again.";
    shell.contentHost.replaceChildren(errorHost);
  }
}
