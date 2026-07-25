// STATE
const MERMAID_SRC = "js/vendor/mermaid.min.js";
const MERMAID_SELECTOR = ".mermaid";
const SOURCE_ATTR = "data-mermaid-source";
const THEME_EVENT = "app:themechange";
let mermaidPromise = null;
let themeListenerReady = false;

// BUILD
/** Initializes Mermaid rendering behavior */
function initializeMermaid(mermaid) {
  if (!mermaid || !mermaid.initialize) return;
  mermaid.initialize({
    startOnLoad: false
  });
}


/** Loads Mermaid only when a diagram needs it */
export function loadMermaid() {
  if (window.mermaid) return Promise.resolve(window.mermaid);
  if (mermaidPromise) return mermaidPromise;
  mermaidPromise = new Promise(function (resolve, reject) {
    const script = document.createElement("script");
    script.src = MERMAID_SRC;
    script.async = true;
    script.onload = function () {
      initializeMermaid(window.mermaid);
      resolve(window.mermaid || null);
    };
    script.onerror = function () {
      reject(new Error("Unable to load Mermaid."));
    };
    document.head.appendChild(script);
  });
  return mermaidPromise;
}


/** Saves a Mermaid element's original source before Mermaid rewrites it */
function saveOriginalSource(element) {
  if (!element || element.hasAttribute(SOURCE_ATTR)) return;
  element.setAttribute(SOURCE_ATTR, element.textContent || "");
}


/** Restores a Mermaid element back to its unprocessed source text */
function restoreOriginalSource(element) {
  if (!element) return;
  saveOriginalSource(element);
  element.textContent = element.getAttribute(SOURCE_ATTR) || "";
  element.removeAttribute("data-processed");
}

/** Renders one Mermaid element using the active app theme */
export async function renderMermaidElement(element) {
  const previousVisibility = element.style.visibility;
  element.style.visibility = "hidden";
  restoreOriginalSource(element);
  const mermaid = await loadMermaid();
  if (!mermaid || !mermaid.run) {
    element.style.visibility = previousVisibility;
    throw new Error("Mermaid is not loaded.");
  }
  initializeMermaid(mermaid);
  await mermaid.run({ nodes: [element] });
  element.style.visibility = previousVisibility;
  installMermaidThemeListener();
}


/** Renders all Mermaid elements on the current page */
export async function renderAllMermaidElements() {
  const elements = Array.from(document.querySelectorAll(MERMAID_SELECTOR));
  await Promise.all(elements.map(renderMermaidElement));
}


/** Re-renders Mermaid diagrams whenever the app theme changes */
export function installMermaidThemeListener() {
  if (themeListenerReady) return;
  themeListenerReady = true;
  window.addEventListener(THEME_EVENT, function () {
    renderAllMermaidElements().catch(function () {});
  });
}
