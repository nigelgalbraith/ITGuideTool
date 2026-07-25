// STATE
const GUIDE_INDEX_URL = "data/guides.json";

// BUILD
/** Fetches JSON and raises a useful error for failed static loads */
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to load " + url + " (" + response.status + ")");
  }
  return response.text();
}


/** Fetches JSON and raises a useful error for failed static loads */
async function fetchJSON(url) {
  return JSON.parse(await fetchText(url));
}


/** Loads the full guide registry */
export async function loadGuideRegistry() {
  return fetchJSON(GUIDE_INDEX_URL);
}


/** Loads the guide index */
export async function loadGuideIndex() {
  const data = await loadGuideRegistry();
  return data && Array.isArray(data.categories) ? data.categories : [];
}


/** Returns all guide entries from the category registry */
function getGuideEntries(index) {
  return (index || []).flatMap(function (category) {
    return category && Array.isArray(category.guides) ? category.guides : [];
  });
}


/** Finds one category registry entry by id */
export function findCategoryEntry(index, categoryId) {
  return (index || []).find(function (category) {
    return category && category.id === categoryId;
  }) || null;
}


/** Returns the JSON path for an index entry */
export function getGuidePath(entry) {
  if (!entry || !entry.id) return "";
  return entry.path || "";
}


/** Loads one guide JSON file from an index entry */
export async function loadGuide(entry) {
  const path = getGuidePath(entry);
  if (!path) return null;
  return fetchJSON("data/" + path);
}


/** Loads all guide JSON files for one category */
export async function loadGuidesForCategory(category) {
  const entries = category && Array.isArray(category.guides) ? category.guides : [];
  const guides = await Promise.all(entries.map(function (entry) {
    return loadGuide(entry).catch(function (error) {
      console.warn("Unable to load guide:", getGuidePath(entry), error);
      return null;
    });
  }));
  return guides.filter(Boolean);
}


/** Finds one guide index entry by id */
export function findGuideEntry(index, guideId) {
  return getGuideEntries(index).find(function (entry) {
    return entry && entry.id === guideId;
  }) || null;
}
