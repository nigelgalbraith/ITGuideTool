# IT Guide Tool

IT Guide Tool is a static IT troubleshooting guide website built for GitHub Pages. It helps users choose an IT problem category, open a troubleshooting guide, and work through a JSON-driven decision tree one step at a time.

There is no backend, framework, package manager, or build step required. The site is served as static HTML, CSS, JavaScript, JSON, and image files.

## Project Overview

The website is organised around this navigation flow:

```text
Home
→ Categories
→ Guides
→ Decision Tree
```

The app loads `data/guides.json` as the guide registry. That registry defines the home page content, troubleshooting categories, and the guide JSON file paths. Individual guide files contain the decision-tree data used by the interactive guide, Mermaid flowchart, and printable guide reference.

## Technology

| Area | Technology |
| --- | --- |
| Page shell | HTML |
| Layout and themes | CSS |
| App behaviour | JavaScript ES modules |
| Guide content | JSON guide data |
| Flowcharts | Vendored Mermaid.js |
| Image generation | Python image optimisation script using Pillow |

## Project Structure

```text
index.html
README.md
LICENSE

css/
  style.css
  print.css

data/
  guides.json
  guides/
    accounts/
    computer/
    files/
    internet/
    peripherals/

images/
  favicon/
  icons/
  main/
    original/
    optimized/
      desktop/
        standard/
        zoom/
      laptop/
        standard/
        zoom/
      mobile/
        standard/
        zoom/

js/
  app.js
  themeToggle.js
  core/
  pages/
  panes/
  vendor/

PythonFiles/
  Image-Optimizer.py
```

## Navigation

The router reads query-string values:

| Page | Example URL | Purpose |
| --- | --- | --- |
| Home | `index.html` | Displays category cards. |
| Category | `?page=category&category=computer` | Displays guides in one category. |
| Guide | `index.html?page=guide&guide=noInternet` | Displays one guide and its decision tree. |

## Categories

The current categories are:

- Computer
- Internet
- Peripherals
- Accounts
- Files

## Guide Registry

The guide registry is `data/guides.json`.

Top-level structure:

```json
{
  "home": {
    "title": "IT How-To Guide",
    "intro": []
  },
  "categories": []
}
```

Each category contains:

| Field | Purpose |
| --- | --- |
| `id` | Stable category key used in URLs. |
| `title` | Display title. |
| `description` | Short category summary. |
| `intro` | Intro paragraphs shown on the category page. |
| `guides` | Ordered guide entries for that category. |

Each guide entry contains:

| Field | Purpose |
| --- | --- |
| `id` | Stable guide key used in guide URLs. |
| `path` | Path to the guide JSON file relative to `data/`. |

Example guide entry:

```json
{
  "id": "noInternet",
  "path": "guides/internet/noInternet.json"
}
```

## Guide Data

Each guide JSON file defines metadata, intro text, a start node, and a `nodes` object.

Common guide fields:

| Field | Purpose |
| --- | --- |
| `id` | Guide identifier. |
| `title` | Guide page title. |
| `cardText` | Text shown on guide cards. |
| `text` | Intro text shown on the guide page. |
| `startNode` | First decision-tree node. |
| `nodes` | Decision-tree node map. |

Each decision node commonly contains:

| Field | Purpose |
| --- | --- |
| `title` | Step heading. |
| `body` | Step instructions. |
| `successLabel` | Label for the success branch button. |
| `failLabel` | Label for the fail branch button. |
| `successNext` | Next node ID for the success path, or `null`. |
| `failNext` | Next node ID for the fail path, or `null`. |
| `type` | Optional node type. |

A node is terminal when either:

- `type` is `"terminal"`;
- both `successNext` and `failNext` are `null`.

Guide JSON text is plain text. HTML in guide JSON is not supported.

## Guide Images

Guide steps can optionally include an image:

```json
{
  "image": "router-lights.png",
  "alt": "Router status lights",
  "caption": "Optional caption"
}
```

Guide JSON stores only the image filename. It must not include folder paths. JavaScript builds the device-specific paths automatically.

## Image Folder Structure

Responsive guide images use this structure:

```text
images/
  main/
    original/
    optimized/
      desktop/
        standard/
        zoom/
      laptop/
        standard/
        zoom/
      mobile/
        standard/
        zoom/
```

The same filename is preserved across generated folders.

Example:

```text
images/main/original/router-lights.png
images/main/optimized/desktop/standard/router-lights.png
images/main/optimized/desktop/zoom/router-lights.png
images/main/optimized/laptop/standard/router-lights.png
images/main/optimized/laptop/zoom/router-lights.png
images/main/optimized/mobile/standard/router-lights.png
images/main/optimized/mobile/zoom/router-lights.png
```

## Image Loading

Guide image loading is handled by `js/core/imageLoader.js` and `js/core/imageModal.js`.

- Standard images are used inline inside guides.
- Zoom images are used by the image modal.
- Device-specific paths are generated automatically.
- Inline guide images use responsive `<picture>` markup.
- The modal uses zoom image versions.
- Print output uses the desktop standard image.

Standard image path pattern:

```text
images/main/optimized/<device>/standard/<filename>
```

Zoom image path pattern:

```text
images/main/optimized/<device>/zoom/<filename>
```

## Image Optimisation

The Python image optimisation script is:

```text
PythonFiles/Image-Optimizer.py
```

It processes original guide images from:

```text
images/main/original
```

and writes responsive outputs into:

```text
images/main/optimized
```

Generated guide image outputs:

| Device | Standard width | Zoom width |
| --- | ---: | ---: |
| Desktop | 1280px | 1920px |
| Laptop | 1024px | 1366px |
| Mobile | 480px | 768px |

The script also processes icon assets and favicons when their source folders exist.

Install dependency:

```bash
pip install pillow
```

Run from the `PythonFiles/` directory so the script's relative paths resolve correctly:

```bash
cd PythonFiles
python Image-Optimizer.py
```

## Decision Tree Features

- JSON-driven troubleshooting guides
- Success/fail branch navigation
- Terminal states
- Start Over controls
- Guide data validation before rendering
- Mermaid flowchart generation
- Printable guide reference
- Guide images
- Image captions
- Alt text
- Image zoom modal
- Keyboard support for image modal triggers and modal close controls

## Printing

The `Print / Save PDF` button opens a generated printable guide page.

The print page contains:

- guide instructions;
- guide images and captions;
- branch references;
- a Mermaid flowchart.

Print layout is controlled by:

```text
css/print.css
```

Printed guide images use the desktop standard image path, not the zoom image path.

## Local Development

Because the app fetches JSON files, serve it through a local web server instead of opening `index.html` directly from the file system.

From the project root:

```bash
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000
```

## GitHub Pages

This project is suitable for GitHub Pages because it is fully static. Publish the repository through GitHub Pages using the repository root as the site source, then open the generated Pages URL.

## Adding a New Guide

1. Create a new guide JSON file under the correct folder in `data/guides/`.
2. Add the guide `id` and `path` to the correct category in `data/guides.json`.
3. Place original guide images in `images/main/original`.
4. Run the image optimisation script from `PythonFiles/`.
5. Reference only the generated image filename in guide JSON.
6. Test the guide page.
7. Test the image modal.
8. Test the Mermaid flowchart.
9. Test the print output.

Example image reference in a guide step:

```json
{
  "image": "router-lights.png",
  "alt": "Router status lights",
  "caption": "Check the power and internet indicators."
}
```

Example registry entry:

```json
{
  "id": "newGuideId",
  "path": "guides/computer/newGuideId.json"
}
```

## License

MIT License
