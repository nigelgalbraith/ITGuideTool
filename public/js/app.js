// IMPORTS
import { initHomePage } from "./pages/homePage.js";
import { initGuidePage } from "./pages/guidePage.js";
import { initCategoryPage } from "./pages/categoryPage.js";

// BUILD
/** Reads the current page key from the URL */
function getPageKey() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("page") || "home").trim();
}


/** Initializes the application router */
async function initApp() {
  const page = getPageKey();
  if (page === "guide") {
    await initGuidePage();
    return;
  }
  if (page === "category") {
    await initCategoryPage();
    return;
  }
  await initHomePage();
}

initApp();
