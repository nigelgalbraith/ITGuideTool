// IMPORTS
import { createPageLifecycle } from "../../../js/core/pageLifecycle.js";
import { initThemeToggle } from "../../../js/themeToggle.js";
import { buildEditorAppShell } from "./appShell.js";

// BUILD
/** Creates an editor page runtime with shell and lifecycle cleanup */
export function createEditorPageRuntime({ pageTitle, activeNavKey }) {
  const lifecycle = createPageLifecycle();
  const shell = buildEditorAppShell({ pageTitle, activeNavKey });
  const cleanupTheme = initThemeToggle(document);
  lifecycle.add(cleanupTheme);
  const onPageHide = function () {
    lifecycle.destroy();
  };
  window.addEventListener("pagehide", onPageHide);
  lifecycle.add(() => window.removeEventListener("pagehide", onPageHide));
  return { shell, lifecycle };
}
