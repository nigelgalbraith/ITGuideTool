# ITGuideTool Editor

The ITGuideTool Editor is a browser-based editor for creating, editing, validating and maintaining ITGuideTool troubleshooting guides.

The editor uses the same JSON guide format as the public ITGuideTool website. There is no database—guides are edited directly as JSON files and are immediately available to the public site.

---

## Features

- Browse existing guides
- Create new guides
- Edit guide metadata
- Add, edit and remove questions
- Add and edit outcomes
- Set the start node
- Validate guide structure before saving
- Save guides directly to JSON
- Automatic backups before changes
- Delete guides

The editor is designed to work alongside the public ITGuideTool website without changing how the website itself operates.

---

## Architecture

The project consists of two independent parts.

### Public Website

The public website is a read-only troubleshooting application.

It loads guide data from:

```
public/data/
```

and displays guides to end users.

### Editor

The editor provides a graphical interface for maintaining those same guide files.

It communicates with a lightweight Flask API that performs:

- loading guides
- validation
- saving
- deleting
- backup creation

There is no separate database.

The JSON files remain the single source of truth.

---

## Folder Structure

```
ITGuideToolEditor/
│
├── app.py
├── compose.yaml
├── Dockerfile
├── requirements.txt
│
├── backups/
│
├── editor/
│   ├── index.html
│   ├── css/
│   └── js/
│
└── public/
    ├── index.html
    ├── css/
    ├── js/
    ├── images/
    └── data/
```

---

## Running with Docker

Build and start the editor:

```bash
docker compose up --build
```

Open:

```
http://localhost:5000
```

Public editor:

```
http://localhost:5000/editor
```

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

- guide changes persist
- backups persist
- rebuilding the container does not lose data

---

## Guide Storage

Each guide is stored as a JSON file.

Example:

```
public/data/guides/network/wifi-not-working.json
```

The guide index is stored in:

```
public/data/guides.json
```

Saving a guide automatically updates both the guide file and the guide index.

---

## Backups

Before overwriting or deleting a guide the editor automatically creates a timestamped backup.

Backups are stored in:

```
backups/
```

No manual backup process is required.

---

## Validation

Before saving, guides are validated to ensure:

- valid guide ID
- title present
- start node exists
- node IDs are unique
- node references are valid
- required fields are present

Invalid guides cannot be saved.

---

## Editor Workflow

The editor is designed around two simple modes.

### Browse

Select an existing guide or create a new one.

### Edit

Once a guide is opened:

- edit metadata
- edit questions
- edit outcomes
- validate
- save
- delete

When editing, the guide list is hidden to maximise workspace.

Selecting **Back to Guides** returns to the guide browser.

---

## Technology

Backend

- Python
- Flask
- Waitress

Frontend

- HTML
- CSS
- Vanilla JavaScript

Deployment

- Docker
- Docker Compose

---

## Design Goals

The editor intentionally keeps the architecture simple.

- No database
- No framework dependency
- Human-readable JSON
- Version-control friendly
- Easy backups
- Easy deployment
- Minimal server requirements

Everything required to run the editor is contained within the project.

---

## Future Enhancements

Potential future improvements include:

- drag-and-drop node ordering
- search guides
- duplicate guide
- duplicate node
- undo/redo
- keyboard shortcuts
- schema versioning
- import/export guides
- richer validation
- visual graph editor

---

## License

This project forms part of the ITGuideTool project.
