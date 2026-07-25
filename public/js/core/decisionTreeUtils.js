// IMPORTS
import { getStandardGuideImagePath } from "./imageModal.js";

// BUILD
/** Returns the display title for a guide node */
export function getNodeTitle(guide, nodeId) {
  const node = guide && guide.nodes ? guide.nodes[nodeId] : null;
  return node && node.title ? node.title : String(nodeId || "");
}


/** Returns the configured branch label or default */
export function getBranchLabel(node, branch) {
  if (branch === "success") return node && node.successLabel ? node.successLabel : "Success";
  return node && node.failLabel ? node.failLabel : "Fail";
}


/** Returns whether a node is an explicit terminal node */
export function isTerminalNode(node) {
  return Boolean(node && (
    node.type === "terminal" ||
    (node.successNext === null && node.failNext === null)
  ));
}


/** Escapes a value for safe HTML output */
function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


/** Converts a guide key to a stable Mermaid node id */
function getMermaidNodeId(key, usedIds) {
  const base = "node_" + String(key || "item").replace(/[^A-Za-z0-9_]/g, "_");
  let id = base;
  let count = 2;
  while (usedIds[id]) {
    id = base + "_" + count;
    count += 1;
  }
  usedIds[id] = true;
  return id;
}


/** Escapes a value for a Mermaid label */
function escapeMermaidLabel(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\s+/g, " ")
    .trim();
}


/** Wraps Mermaid labels with line breaks */
function wrapMermaidLabel(value) {
  const words = escapeMermaidLabel(value).split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach(function (word) {
    const next = line ? line + " " + word : word;
    if (next.length > 22 && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = next;
  });
  if (line) lines.push(line);
  return lines.join("<br/>");
}


/** Builds Mermaid ids for all configured nodes */
function buildNodeIdMap(nodes) {
  const usedIds = {};
  const map = {};
  Object.keys(nodes || {}).forEach(function (key) {
    map[key] = getMermaidNodeId(key, usedIds);
  });
  return map;
}


/** Adds a Mermaid edge to the diagram output */
function addEdge(lines, fromId, label, toId) {
  lines.push("  " + fromId + " -->|" + escapeMermaidLabel(label) + "| " + toId);
}


/** Builds the Mermaid node declaration for a guide node */
function buildNodeDeclaration(id, key, node) {
  const label = wrapMermaidLabel(node.title || key);
  if (node.type === "question") return "  " + id + "{\"" + label + "\"}";
  return "  " + id + "[\"" + label + "\"]";
}


/** Builds Mermaid flowchart syntax from decision tree data */
function buildMermaidInit() {
  return `%%{init: {
    "flowchart": {
      "htmlLabels": true,
      "nodeSpacing": 70,
      "rankSpacing": 90,
      "curve": "basis",
      "wrappingWidth": 180
    }
  }}%%`;
}


/** Builds Mermaid flowchart syntax from decision tree data */
export function buildDecisionTreeMermaid(guide) {
  const nodes = guide && guide.nodes ? guide.nodes : {};
  const nodeIds = buildNodeIdMap(nodes);
  const lines = [
    buildMermaidInit(),
    "flowchart TD"
  ];
  let hasResolvedEnd = false;
  let hasFailEnd = false;
  const normalClasses = [];
  Object.keys(nodes).forEach(function (key) {
    const node = nodes[key] || {};
    const id = nodeIds[key];
    lines.push(buildNodeDeclaration(id, key, node));
    normalClasses.push(id);
  });
  Object.keys(nodes).forEach(function (key) {
    const node = nodes[key] || {};
    const id = nodeIds[key];
    if (isTerminalNode(node)) return;
    if (node.successNext === null) {
      hasResolvedEnd = true;
      addEdge(lines, id, getBranchLabel(node, "success"), "RESOLVED");
    } else if (nodeIds[node.successNext]) {
      addEdge(lines, id, getBranchLabel(node, "success"), nodeIds[node.successNext]);
    }
    if (node.failNext === null) {
      hasFailEnd = true;
      addEdge(lines, id, getBranchLabel(node, "fail"), "END");
    } else if (nodeIds[node.failNext]) {
      addEdge(lines, id, getBranchLabel(node, "fail"), nodeIds[node.failNext]);
    }
  });
  if (hasResolvedEnd) lines.push("  RESOLVED([\"Resolved\"])");
  if (hasFailEnd) lines.push("  END([\"End\"])");
  if (normalClasses.length) lines.push("  class " + normalClasses.join(",") + " normal");
  if (hasResolvedEnd) lines.push("  class RESOLVED success");
  if (hasFailEnd) lines.push("  class END fail");
  if (guide && guide.startNode && nodeIds[guide.startNode]) {
    lines.push("  class " + nodeIds[guide.startNode] + " startNode");
  }
  return lines.join("\n");
}


/** Gets the printable node order starting from startNode */
export function getGuideNodeOrder(guide) {
  const nodes = guide && guide.nodes ? guide.nodes : {};
  const order = [];
  const visited = {};
  function visit(nodeId) {
    if (!nodeId || visited[nodeId] || !nodes[nodeId]) return;
    visited[nodeId] = true;
    order.push(nodeId);
    if (isTerminalNode(nodes[nodeId])) return;
    visit(nodes[nodeId].successNext);
    visit(nodes[nodeId].failNext);
  }
  visit(guide && guide.startNode);
  Object.keys(nodes).forEach(visit);
  return order;
}


/** Builds printable reference HTML */
function buildPrintableBodyHtml(body) {
  const items = Array.isArray(body) ? body : [];
  if (!items.length) return "";
  if (items.length === 1) {
    return "<p class=\"print-node-body\">" + escapeHTML(items[0]) + "</p>";
  }
  const bodyHtml = items.map(function (item) {
    return "<li>" + escapeHTML(item) + "</li>";
  }).join("");
  return "<ul class=\"print-node-list\">" + bodyHtml + "</ul>";
}


/** Builds printable guide image HTML */
function buildPrintableImageHtml(node) {
  const imageName = String(node && node.image || "").trim();
  if (!imageName) return "";
  const caption = String(node.caption || "").trim();
  const captionHtml = caption
    ? "<figcaption class=\"print-guide-image-caption\">" + escapeHTML(caption) + "</figcaption>"
    : "";
  return [
    "<figure class=\"print-guide-image\">",
    "<img class=\"print-guide-image-img\" src=\"" + escapeHTML(getStandardGuideImagePath("desktop", imageName)) + "\" alt=\"" + escapeHTML(node.alt || "") + "\">",
    captionHtml,
    "</figure>"
  ].join("");
}


/** Builds printable reference HTML */
function buildInstructionsHtml(guide) {
  return getGuideNodeOrder(guide).map(function (nodeId, index) {
    const node = guide.nodes[nodeId] || {};
    const bodyHtml = buildPrintableBodyHtml(node.body);
    const imageHtml = buildPrintableImageHtml(node);
    const successTitle = node.successNext === null ? "Resolved" : getNodeTitle(guide, node.successNext);
    const failTitle = node.failNext === null ? "End" : getNodeTitle(guide, node.failNext);
    const successLabel = getBranchLabel(node, "success");
    const failLabel = getBranchLabel(node, "fail");
    const branchHtml = isTerminalNode(node) ? "" : [
      "<p class=\"print-branch\"><strong>" + escapeHTML(successLabel) + ":</strong> " + escapeHTML(successTitle) + "</p>",
      "<p class=\"print-branch\"><strong>" + escapeHTML(failLabel) + ":</strong> " + escapeHTML(failTitle) + "</p>"
    ].join("");
    const sectionHtml = [
      "<section class=\"print-node\">",
      "<h3 class=\"print-node-title\">" + escapeHTML(getNodeTitle(guide, nodeId)) + "</h3>",
      bodyHtml,
      imageHtml,
      branchHtml,
      "</section>"
    ].join("");
    if (index === 0) return sectionHtml;
    return "<hr class=\"print-node-divider\">" + sectionHtml;
  }).join("");
}


/** Builds a complete printable guide document */
export function buildPrintableGuideHtml(guide) {
  const title = guide && guide.title ? guide.title : "IT How-To Guide";
  const mermaidDefinition = buildDecisionTreeMermaid(guide);
  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\">",
    "<title>" + escapeHTML(title) + "</title>",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    "<link rel=\"stylesheet\" href=\"css/print.css\">",
    "</head>",
    "<body class=\"print-document\">",
    "<main class=\"print-page\">",
    "<h1 class=\"print-title\">" + escapeHTML(title) + "</h1>",
    "<h2 class=\"print-section-title\">Guide Reference</h2>",
    buildInstructionsHtml(guide),
    "<section class=\"print-diagram\">",
    "<h2 class=\"print-section-title\">Flowchart</h2>",
    "<div id=\"printDiagram\" class=\"print-diagram-canvas\"></div>",
    "<pre id=\"printFallback\" class=\"print-fallback\" hidden></pre>",
    "</section>",
    "</main>",
    "<script src=\"js/vendor/mermaid.min.js\"><\/script>",
    "<script>",
    "const mermaidDefinition=" + JSON.stringify(mermaidDefinition) + ";",
    "const diagramBox=document.getElementById('printDiagram');",
    "const fallback=document.getElementById('printFallback');",
    "function printSoon(){setTimeout(function(){window.focus();window.print();},300);}",
    "function showRenderError(message){",
    "fallback.hidden=false;",
    "fallback.textContent=message;",
    "}",
    "function fitDiagramToPage(){",
    "const svg=diagramBox.querySelector('svg');",
    "if(!svg)return;",
    "const boxWidth=diagramBox.clientWidth;",
    "const boxHeight=diagramBox.clientHeight;",
    "const svgBox=svg.getBBox();",
    "const scale=Math.min(boxWidth/svgBox.width,boxHeight/svgBox.height,1);",
    "svg.setAttribute('width',svgBox.width*scale);",
    "svg.setAttribute('height',svgBox.height*scale);",
    "svg.setAttribute('viewBox',svgBox.x+' '+svgBox.y+' '+svgBox.width+' '+svgBox.height);",
    "}",
    "function insertRenderedSvg(svgMarkup){",
    "if(!svgMarkup)throw new Error('Mermaid returned empty SVG.');",
    "fallback.hidden=true;",
    "fallback.textContent='';",
    "diagramBox.innerHTML=svgMarkup;",
    "fitDiagramToPage();",
    "requestAnimationFrame(function(){",
    "requestAnimationFrame(printSoon);",
    "});",
    "}",
    "if(window.mermaid&&window.mermaid.render){",
    "mermaid.initialize({startOnLoad:false});",
    "mermaid.render('printDecisionTreeDiagram',mermaidDefinition).then(function(result){",
    "insertRenderedSvg(result.svg);",
    "}).catch(function(error){",
    "showRenderError('Unable to render the Mermaid flowchart. Print the guide reference, then retry the flowchart after checking the diagram data.');",
    "});",
    "}else{showRenderError('Unable to load Mermaid. The flowchart could not be rendered.');}",
    "<\/script>",
    "</body>",
    "</html>"
  ].join("");
}
