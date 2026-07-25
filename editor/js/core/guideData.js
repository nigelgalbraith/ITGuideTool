// BUILD
/** Converts textarea content to trimmed non-empty lines */
export function textLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}


/** Converts an array of lines to textarea content */
export function linesText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}


/** Clones a JSON-compatible value */
export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}


/** Creates a guide id from a title */
export function makeId(title) {
  const words = String(title || "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "newGuide";
  return words[0].toLowerCase() + words.slice(1).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}


/** Creates a blank guide using the editor's default structure */
export function emptyGuide() {
  return {
    id: "newGuide",
    title: "New Guide",
    cardText: ["Describe what this guide helps diagnose."],
    icon: "",
    text: ["Explain when to use this guide."],
    startNode: "start",
    nodes: {
      start: {
        title: "First check",
        body: ["Describe the first troubleshooting check."],
        successLabel: "Yes",
        failLabel: "No",
        successNext: null,
        failNext: null
      }
    }
  };
}


/** Requests JSON from the editor API */
export async function requestJson(url, options = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 5000);
  const abortRequest = () => controller.abort();

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", abortRequest, { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
      signal: controller.signal
    });
    const data = await response.json().catch((error) => {
      if (timedOut && error.name === "AbortError") throw error;
      return {};
    });
    if (!response.ok) {
      const messages = data.errors || [data.error || `Request failed (${response.status}).`];
      throw new Error(messages.join("\n"));
    }
    return data;
  } catch (error) {
    if (timedOut && error.name === "AbortError") {
      throw new Error("Unable to connect to the editor API.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (options.signal) {
      options.signal.removeEventListener("abort", abortRequest);
    }
  }
}
