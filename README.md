# ITGuideTool

ITGuideTool is a browser-based IT troubleshooting application with a companion editor for creating, editing, validating and maintaining troubleshooting guides.

The public website provides interactive, step-by-step troubleshooting guides organised by category, along with a search function for finding guides by title or description.

The editor maintains the same JSON guide files used by the public website. There is no database—guides are stored as readable JSON files.

---

## Features

### Public Website

- Browse troubleshooting guides by category
- Search all guides by title or description
- Follow interactive, step-by-step troubleshooting instructions
- Navigate questions, decisions and outcomes
- View supporting images and descriptions
- Open external reference links in new tabs
- Print troubleshooting guides
- Use the website as a standalone static site

### Editor

- Browse existing guides
- Create new guides
- Edit guide metadata
- Add, edit and remove questions
- Add and edit outcomes
- Set the start node
- Add supporting images and external links
- Preview troubleshooting guides
- Validate guide structure before saving
- Save guides directly to JSON
- Automatic backups before changes
- Delete guides

The editor works alongside the public website without requiring changes to the public application's architecture.

---

## Architecture

The project consists of two independent parts that share the same guide data.

### Public Website

The public website is a read-only troubleshooting application that can be hosted as a static website, including on GitHub Pages.

It loads guide data from:

`public/data/`

The public website provides:

- A main page displaying troubleshooting categories
- Category pages displaying their available guides
- A search page displaying all guides and filtering by title or description
- Interactive troubleshooting pages for individual guides
- Printable troubleshooting instructions

Page titles, introductions, categories and guide references are maintained through `public/data/guides.json`.

### Editor

The editor provides a graphical interface for maintaining the same JSON guide files.

It communicates with a lightweight Flask API that performs:

- Loading guides
- Validation
- Saving
- Deleting
- Backup creation

There is no separate database.

The JSON files remain the single source of truth.

---

## Folder Structure

```
ITGuideTool/
│
├── app.py
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
│
├── backups/
│
├── editor/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── core/
│       ├── pages/
│       └── panes/
│
└── public/
    ├── index.html
    ├── css/
    │   ├── print.css
    │   └── style.css
    ├── js/
    │   ├── app.js
    │   ├── core/
    │   ├── pages/
    │   │   ├── homePage.js
    │   │   ├── categoryPage.js
    │   │   ├── guidePage.js
    │   │   └── searchPage.js
    │   └── panes/
    ├── images/
    │   └── main/
    │       ├── original/
    │       └── optimized/
    ├── data/
    │   ├── guides.json
    │   └── guides/
    │       ├── software/
    │       ├── internet/
    │       ├── printers/
    │       ├── peripherals/
    │       ├── hardware/
    │       ├── email/
    │       ├── security/
    │       └── files/
    ├── PythonFiles/
    │   └── Image-Optimizer.py
    ├── README.md
    └── LICENSE
```

---

## Running with Docker

Build and start the application:

```bash
docker compose up --build
```

Open the public website:

`http://localhost:5000`

Open the editor:

`http://localhost:5000/editor`

The public website can also be hosted independently as a static site without Docker or Flask.

---

## Docker Volumes

Guide data should be mounted so edits are written to the host filesystem.

Example:

```yaml
services:
  it-guide-tool:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./public/data:/app/public/data
      - ./backups:/app/backups
```

This ensures:

- Guide changes persist
- Backups persist
- Rebuilding the container does not lose data

---

## Guide Storage

Each troubleshooting guide is stored as a JSON file.

Example:

`public/data/guides/internet/noInternet.json`

The central guide registry is stored in:

`public/data/guides.json`

The registry defines:

- Home page title and introduction
- Search page title and introduction
- Troubleshooting categories
- Category titles and descriptions
- Category introductions
- Guide IDs and file paths

The current guide categories are:

- Software & Operating Systems
- Internet & Networking
- Printers & Scanners
- Peripherals
- Hardware
- Email
- Security & Accounts
- Files & Recovery

Saving a guide automatically updates the guide file and guide registry where necessary.

The public website reads these files directly.

### Adding New Guides

1. Create a new troubleshooting guide using the editor.
2. Enter the guide title, description and other metadata.
3. Add questions, troubleshooting instructions and outcomes.
4. Configure the connections between nodes.
5. Add supporting images and reference links where useful.
6. Validate and save the guide.
7. Confirm the guide is registered in `guides.json` under the correct category.

Guide JSON files should be kept in their corresponding category folders.

---

## Guide Images

Troubleshooting guides can include supporting screenshots, diagrams and reference images.

Images can be downloaded from manufacturer documentation, official support websites or other suitable sources, subject to their reuse permissions. Images can also be created specifically for the guide.

### Adding Images

1. Find or create an image relevant to the troubleshooting step.
2. Download the image from its original source.
3. Save the image in `public/images/main/original/`.
4. Give the image a descriptive filename, such as `router-wan-settings.png`.
5. Run the existing image optimiser.
6. Reference the image filename in the appropriate guide JSON node.

Example:

```json
"image": "router-wan-settings.png",
"alt": "Router WAN configuration settings",
"caption": "Example router WAN settings showing the connection type."
```

The fields have the following purposes:

- `image` — The filename of the original image.
- `alt` — A description of the image for accessibility.
- `caption` — Supporting text displayed with the image.

Use descriptive filenames that identify the image's purpose.

The filename in the JSON must match the original image filename.

### Supported Image Formats

Use PNG or JPEG images for the existing optimisation workflow.

- `.png` — Suitable for screenshots, diagrams and interface images.
- `.jpg` or `.jpeg` — Suitable for photographs.

If an image is provided in an unsupported format, convert it to PNG or JPEG before running the optimiser.

Changing a filename extension does not convert an image format.

### Image Optimisation

The image optimiser is located at:

`public/PythonFiles/Image-Optimizer.py`

Install Pillow if required:

```bash
pip install pillow
```

Run the optimiser from its directory:

```bash
cd public/PythonFiles
python Image-Optimizer.py
```

The script processes the original images and generates optimised versions for:

- Desktop
- Laptop
- Mobile

It also creates standard and zoom versions of the images.

Optimised images are stored under:

`public/images/main/optimized/`

Guide JSON references only the original filename. The public website uses the generated optimised versions automatically.

### Important Notes

- Do not manually edit the generated optimised images.
- Keep the original images in `public/images/main/original/`.
- Run the optimiser whenever new images are added or existing originals are replaced.
- Check that the generated images display correctly in the editor preview and public website.
- If an image has not yet been downloaded, leave its `image` field empty until it is available.
- Do not change application code to add individual guide images.

For further details about the image system, see `public/README.md`.

---

## Guide Links

Troubleshooting steps can include external reference links.

These are useful for:

- Manufacturer support documentation
- Official software and driver downloads
- Printer and router configuration instructions
- Operating system troubleshooting documentation
- ISP connection settings
- Additional reference material

Each guide node can contain a `link` array.

Example:

```json
"link": [
  {
    "name": "Brother software and driver downloads",
    "description": "Find the correct software and drivers for your Brother printer.",
    "url": "https://support.brother.com/g/b/countrytop.aspx?c=nz&lang=en"
  }
]
```

Each link contains:

- `name` — The clickable link text.
- `description` — A short explanation of what the link provides.
- `url` — The external website address.

Multiple links can be added to the same troubleshooting step.

External links automatically open in a new browser tab.

There is no need for an `openInNewTab` setting.

Use official manufacturer or provider documentation where possible, and check that links are correct and relevant to the troubleshooting instructions.

---

## Search Guides

The search page displays guides from every category using the same guide cards as the category pages.

Search works by filtering the loaded guides using:

- Guide titles
- Guide descriptions (`cardText`)

The search is case-insensitive and updates as the user types.

When the search field is empty, all available guides are displayed.

The search operates in the browser and does not require a database, search engine or additional API.

---

## Backups

Before overwriting or deleting a guide, the editor automatically creates a timestamped backup.

Backups are stored in:

`backups/`

No manual backup process is required.

---

## Validation

Before saving, guides are validated to ensure:

- Valid guide ID
- Title present
- Start node exists
- Node IDs are unique
- Node references are valid
- Required fields are present

Invalid guides cannot be saved.

---

## Editor Workflow

The editor is designed around two simple modes.

### Browse

Select an existing guide or create a new one.

### Edit

Once a guide is opened:

- Edit metadata
- Edit questions
- Edit outcomes
- Add supporting images and external links
- Preview the troubleshooting guide
- Validate
- Save
- Delete

When editing, the guide list is hidden to maximise workspace.

Selecting **Back to Guides** returns to the guide browser.

---

## Technology

### Backend

- Python
- Flask
- Waitress

### Frontend

- HTML
- CSS
- Vanilla JavaScript

### Deployment

- Docker
- Docker Compose
- Static hosting (including GitHub Pages) for the public website

---

## Design Goals

ITGuideTool intentionally keeps the architecture simple, reusable and easy to extend.

- No database
- No frontend framework dependency
- Readable JSON
- Version-control friendly
- Reusable page components and panes
- Consistent layouts and styling
- Shared guide-loading functionality
- Minimal changes when adding pages or features
- Easy backups
- Easy deployment
- Minimal server requirements

The public website and editor share the same guide format while remaining independently deployable.

Adding a new page should reuse existing components rather than duplicate layouts or functionality.

New guides should work with the existing JSON schema, guide loader, image system and reusable page components without requiring changes to application code.

---

## Future Enhancements

Potential future improvements include:

- Drag-and-drop node ordering
- Duplicate guide
- Duplicate node
- Undo/redo
- Keyboard shortcuts
- Schema versioning
- Import/export guides
- Richer validation
- Visual graph editor

---

## License

This project forms part of the ITGuideTool project.
