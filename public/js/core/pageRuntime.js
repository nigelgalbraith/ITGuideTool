// IMPORTS
import { buildAppShell } from "./appShell.js";
import { createPageLifecycle } from "./pageLifecycle.js";
import { initThemeToggle } from "../themeToggle.js";

// BUILD
/** Creates a page runtime with shell and lifecycle cleanup */
export function createPageRuntime({ pageTitle, activeNavKey }) {
  const lifecycle = createPageLifecycle();
  const shell = buildAppShell({ pageTitle, activeNavKey });
  const cleanupTheme = initThemeToggle(document);
  lifecycle.add(cleanupTheme);
  const onPageHide = function () {
    lifecycle.destroy();
  };
  window.addEventListener("pagehide", onPageHide);
  lifecycle.add(() => window.removeEventListener("pagehide", onPageHide));
  return { shell, lifecycle };
}
