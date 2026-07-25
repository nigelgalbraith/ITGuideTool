import { createPageRuntime } from "../core/pageRuntime.js";
import { el, titleCase } from "../core/helpers.js";
import { findGuideEntry, loadGuide, loadGuideIndex } from "../core/guideData.js";
import { validateGuideData } from "../core/guideValidation.js";
import { buildIntroPane } from "../panes/IntroPane.js";
import { buildDecisionTreePane } from "../panes/DecisionTreePane.js";
import { buildDecisionTreeDiagramPane } from "../panes/DecisionTreeDiagramPane.js";
import { buildDecisionTreePrintPane } from "../panes/DecisionTreePrintPane.js";
import { buildFooterPane } from "../panes/FooterPane.js";

// STATE
const BASE_TITLE = "IT How-To Guide";
const BACK_NAV_KEY = "home";
const GUIDE_LOAD_ERROR_MESSAGE = "Unable to load this guide. Please check the guide files and try again.";

// BUILD
/** Reads the current guide key from the URL */
function getGuideKey() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("guide") || "").trim();
}


/** Builds the shared guide message host */
function buildGuideMessageHost() {
  const host = document.createElement("div");
  host.className = "intro-text";
  host.id = "introHost";
  return host;
}


/** Renders the missing guide URL parameter message */
function renderMissingParamMessage(host) {
  const paragraph = document.createElement("p");
  paragraph.appendChild(document.createTextNode("Missing required URL parameter: "));
  paragraph.appendChild(el("code", "", "?guide="));
  host.appendChild(paragraph);
}


/** Renders guide validation errors and prevents guide panes from rendering */
function renderValidationErrors(host, errors) {
  const pane = el("section", "pane guide-validation-error");
  pane.appendChild(el("h2", "", "Guide data error"));
  pane.appendChild(el("p", "", "This guide cannot be displayed because its data has validation errors."));
  const list = el("ul", "guide-validation-error-list");
  errors.forEach(function (error) {
    list.appendChild(el("li", "", error));
  });
  pane.appendChild(list);
  host.appendChild(pane);
}


/** Renders a visitor-facing guide loading error */
function renderGuideLoadError(host) {
  const introHost = buildGuideMessageHost();
  introHost.appendChild(el("p", "", GUIDE_LOAD_ERROR_MESSAGE));
  host.appendChild(introHost);
}


/** Appends the footer pane after the main page content */
function appendFooter(shell, lifecycle) {
  const footerPane = buildFooterPane();
  shell.appRoot.appendChild(footerPane.node);
  lifecycle.add(footerPane.destroy);
}


/** Initializes the guide page orchestrator */
export async function initGuidePage() {
  const { lifecycle, shell } = createPageRuntime({
    pageTitle: BASE_TITLE,
    activeNavKey: BACK_NAV_KEY
  });
  const guide = getGuideKey();
  const heading = shell.header.querySelector("#pageTitle");
  if (!guide) {
    const introHost = buildGuideMessageHost();
    renderMissingParamMessage(introHost);
    shell.contentHost.appendChild(introHost);
    if (heading) heading.textContent = BASE_TITLE;
    document.title = BASE_TITLE;
    appendFooter(shell, lifecycle);
    return;
  }
  let guideIndex = [];
  let guideConfig = null;
  try {
    guideIndex = await loadGuideIndex();
    const guideEntry = findGuideEntry(guideIndex, guide);
    guideConfig = guideEntry ? await loadGuide(guideEntry) : null;
  } catch (error) {
    console.error("Unable to load guide data for \"" + guide + "\":", error);
    renderGuideLoadError(shell.contentHost);
    if (heading) heading.textContent = titleCase(guide);
    document.title = titleCase(guide);
    appendFooter(shell, lifecycle);
    return;
  }
  if (!guideConfig) {
    const introHost = buildGuideMessageHost();
    introHost.appendChild(el("p", "", "Guide not found."));
    shell.contentHost.appendChild(introHost);
    if (heading) heading.textContent = titleCase(guide);
    document.title = titleCase(guide);
    appendFooter(shell, lifecycle);
    return;
  }
  const displayName = guideConfig.title || titleCase(guide);
  if (heading) heading.textContent = displayName;
  document.title = displayName;
  const validationErrors = validateGuideData(guideConfig);
  if (validationErrors.length) {
    renderValidationErrors(shell.contentHost, validationErrors);
    appendFooter(shell, lifecycle);
    return;
  }
  const introPane = buildIntroPane({
    text: guideConfig.text || "",
    className: "intro-text",
    id: "introHost"
  });
  const decisionTreePane = buildDecisionTreePane({
    id: "decisionTreeHost",
    guide: guideConfig,
    title: "Decision Tree"
  });
  const diagramPane = buildDecisionTreeDiagramPane({
    id: "decisionTreeDiagramHost",
    guide: guideConfig,
    title: "Guide Flowchart"
  });
  const printPane = buildDecisionTreePrintPane({
    id: "decisionTreePrintHost",
    guide: guideConfig,
    title: "Print"
  });
  shell.contentHost.appendChild(introPane.node);
  shell.contentHost.appendChild(decisionTreePane.node);
  shell.contentHost.appendChild(diagramPane.node);
  shell.contentHost.appendChild(printPane.node);
  appendFooter(shell, lifecycle);
  lifecycle.add(introPane.destroy);
  lifecycle.add(decisionTreePane.destroy);
  lifecycle.add(diagramPane.destroy);
  lifecycle.add(printPane.destroy);
}
