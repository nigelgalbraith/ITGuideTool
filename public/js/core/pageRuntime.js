
// IMPORTS
import { buildAppShell } from "./appShell.js";
import { createPageLifecycle } from "./pageLifecycle.js";
import { initThemeToggle } from "../themeToggle.js";
import { buildFooterPane } from "../panes/FooterPane.js";

// BUILD
/** Creates a page runtime with shell and lifecycle cleanup */
export function createPageRuntime({ pageTitle, activeNavKey }) {
  const lifecycle = createPageLifecycle();
  const shell = buildAppShell({ pageTitle, activeNavKey });
  const footerPane = buildFooterPane();
  shell.appRoot.appendChild(footerPane.node);
  lifecycle.add(footerPane.destroy);
  const cleanupTheme = initThemeToggle(document);
  lifecycle.add(cleanupTheme);
  const onPageHide = function () {
    lifecycle.destroy();
  };
  window.addEventListener("pagehide", onPageHide);
  lifecycle.add(() => window.removeEventListener("pagehide", onPageHide));
  return { shell, lifecycle };
}
