from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).parent

PUBLIC_DIR = BASE_DIR / "public"
EDITOR_DIR = BASE_DIR / "editor"
DATA_DIR = PUBLIC_DIR / "data"
GUIDE_INDEX_PATH = DATA_DIR / "guides.json"
BACKUP_DIR = BASE_DIR / "backups"
ID_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_-]*$")

app = Flask(__name__, static_folder=None)


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def atomic_write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    if path.exists():
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        relative_name = path.relative_to(DATA_DIR).as_posix().replace("/", "__")
        shutil.copy2(path, BACKUP_DIR / f"{relative_name}.{timestamp}.bak")
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=str(path.parent)
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(value, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    except Exception:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise


def load_index() -> dict[str, Any]:
    index = read_json(GUIDE_INDEX_PATH)
    if not isinstance(index, dict) or not isinstance(index.get("categories"), list):
        raise ValueError("data/guides.json has an invalid structure")
    return index


def find_category(index: dict[str, Any], category_id: str) -> dict[str, Any] | None:
    return next(
        (item for item in index["categories"] if item.get("id") == category_id),
        None,
    )


def find_guide_entry(index: dict[str, Any], guide_id: str) -> tuple[dict[str, Any], dict[str, Any]] | None:
    for category in index["categories"]:
        for guide in category.get("guides", []):
            if guide.get("id") == guide_id:
                return category, guide
    return None


def resolve_guide_path(relative_path: str) -> Path:
    candidate = (DATA_DIR / relative_path).resolve()
    if DATA_DIR not in candidate.parents:
        raise ValueError("Guide path must remain inside the data directory")
    return candidate


def validate_identifier(value: Any, label: str) -> list[str]:
    text = str(value or "").strip()
    if not text:
        return [f"{label} is required."]
    if not ID_PATTERN.fullmatch(text):
        return [f"{label} must start with a letter and contain only letters, numbers, underscores, or hyphens."]
    return []


def validate_text_list(value: Any, label: str, required: bool = False) -> list[str]:
    if value is None and not required:
        return []
    if not isinstance(value, list):
        return [f"{label} must be a list of text values."]
    if required and not value:
        return [f"{label} must contain at least one item."]
    return [f"{label} item {index + 1} must be text." for index, item in enumerate(value) if not isinstance(item, str)]


def validate_guide(guide: Any) -> list[str]:
    errors: list[str] = []
    if not isinstance(guide, dict):
        return ["Guide must be a JSON object."]
    errors.extend(validate_identifier(guide.get("id"), "Guide ID"))
    if not str(guide.get("title") or "").strip():
        errors.append("Guide title is required.")
    errors.extend(validate_text_list(guide.get("cardText"), "cardText"))
    errors.extend(validate_text_list(guide.get("text"), "text"))
    nodes = guide.get("nodes")
    if not isinstance(nodes, dict) or not nodes:
        errors.append("Guide must contain at least one node.")
        return errors
    start_node = str(guide.get("startNode") or "").strip()
    if not start_node:
        errors.append("A start node is required.")
    elif start_node not in nodes:
        errors.append(f'Start node "{start_node}" does not exist.')
    for node_id, node in nodes.items():
        errors.extend(validate_identifier(node_id, f'Node ID "{node_id}"'))
        if not isinstance(node, dict):
            errors.append(f'Node "{node_id}" must be an object.')
            continue
        if not str(node.get("title") or "").strip():
            errors.append(f'Node "{node_id}" needs a title.')
        errors.extend(validate_text_list(node.get("body"), f'Node "{node_id}" body', required=True))
        is_terminal = node.get("type") == "terminal"
        for pointer_name in ("successNext", "failNext"):
            pointer = node.get(pointer_name)
            if pointer in (None, ""):
                continue
            if pointer not in nodes:
                errors.append(f'Node "{node_id}" points to missing node "{pointer}" through {pointer_name}.')
        if not is_terminal:
            if not str(node.get("successLabel") or "").strip():
                errors.append(f'Question node "{node_id}" needs a success label.')
            if not str(node.get("failLabel") or "").strip():
                errors.append(f'Question node "{node_id}" needs a fail label.')

    return errors


def public_guide_summary(index: dict[str, Any]) -> dict[str, Any]:
    categories = []
    for category in index["categories"]:
        category_data = {
            "id": category.get("id", ""),
            "title": category.get("title", ""),
            "description": category.get("description", ""),
            "intro": category.get("intro", []),
            "guides": [],
        }
        for entry in category.get("guides", []):
            try:
                guide = read_json(resolve_guide_path(entry["path"]))
                category_data["guides"].append(
                    {
                        "id": entry.get("id", ""),
                        "title": guide.get("title", entry.get("id", "")),
                        "path": entry.get("path", ""),
                    }
                )
            except (OSError, ValueError, json.JSONDecodeError, KeyError):
                category_data["guides"].append(
                    {
                        "id": entry.get("id", ""),
                        "title": entry.get("id", ""),
                        "path": entry.get("path", ""),
                        "loadError": True,
                    }
                )
        categories.append(category_data)
    return {"categories": categories}


@app.get("/api/editor/guides")
def list_guides():
    try:
        return jsonify(public_guide_summary(load_index()))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        return jsonify({"error": str(error)}), 500


@app.get("/api/editor/guides/<guide_id>")
def get_guide(guide_id: str):
    try:
        index = load_index()
        result = find_guide_entry(index, guide_id)
        if result is None:
            return jsonify({"error": "Guide not found."}), 404
        category, entry = result
        guide = read_json(resolve_guide_path(entry["path"]))
        return jsonify({"categoryId": category["id"], "guide": guide})
    except (OSError, ValueError, json.JSONDecodeError, KeyError) as error:
        return jsonify({"error": str(error)}), 500


@app.post("/api/editor/guides")
def save_guide():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"errors": ["Request body must be JSON."]}), 400
    guide = payload.get("guide")
    category_id = str(payload.get("categoryId") or "").strip()
    original_id = str(payload.get("originalId") or "").strip()
    errors = validate_identifier(category_id, "Category ID") + validate_guide(guide)
    if errors:
        return jsonify({"errors": errors}), 400
    guide_id = guide["id"].strip()
    try:
        index = load_index()
        category = find_category(index, category_id)
        if category is None:
            return jsonify({"errors": [f'Category "{category_id}" does not exist.']}), 400
        existing = find_guide_entry(index, original_id or guide_id)
        id_owner = find_guide_entry(index, guide_id)
        if id_owner is not None and (not existing or id_owner[1] is not existing[1]):
            return jsonify({"errors": [f'Guide ID "{guide_id}" is already in use.']}), 409
        destination_relative = f"guides/{category_id}/{guide_id}.json"
        destination_path = resolve_guide_path(destination_relative)
        if existing:
            old_category, entry = existing
            old_path = resolve_guide_path(entry["path"])
            if entry in old_category.get("guides", []):
                old_category["guides"].remove(entry)
            if old_path != destination_path and old_path.exists():
                timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                BACKUP_DIR.mkdir(parents=True, exist_ok=True)
                shutil.copy2(old_path, BACKUP_DIR / f"renamed__{old_path.name}.{timestamp}.bak")
                old_path.unlink()
        category.setdefault("guides", []).append({"id": guide_id, "path": destination_relative})
        category["guides"].sort(key=lambda item: item.get("id", "").lower())
        start_node = guide["startNode"]
        node_items = list(guide["nodes"].items())
        start_node_index = -1
        for node_index, (node_id, _node) in enumerate(node_items):
            if node_id == start_node:
                start_node_index = node_index
                break
        if start_node_index > 0:
            start_node_item = node_items.pop(start_node_index)
            guide["nodes"] = dict([start_node_item] + node_items)
        atomic_write_json(destination_path, guide)
        atomic_write_json(GUIDE_INDEX_PATH, index)
        return jsonify({"ok": True, "guideId": guide_id, "path": destination_relative})
    except (OSError, ValueError, json.JSONDecodeError, KeyError) as error:
        app.logger.exception("Could not save guide")
        return jsonify({"errors": [f"Could not save guide: {error}"]}), 500


@app.delete("/api/editor/guides/<guide_id>")
def delete_guide(guide_id: str):
    try:
        index = load_index()
        result = find_guide_entry(index, guide_id)
        if result is None:
            return jsonify({"error": "Guide not found."}), 404
        category, entry = result
        guide_path = resolve_guide_path(entry["path"])
        category["guides"].remove(entry)
        if guide_path.exists():
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            BACKUP_DIR.mkdir(parents=True, exist_ok=True)
            shutil.copy2(guide_path, BACKUP_DIR / f"deleted__{guide_path.name}.{timestamp}.bak")
            guide_path.unlink()
        atomic_write_json(GUIDE_INDEX_PATH, index)
        return jsonify({"ok": True})
    except (OSError, ValueError, json.JSONDecodeError, KeyError) as error:
        app.logger.exception("Could not delete guide")
        return jsonify({"error": f"Could not delete guide: {error}"}), 500


@app.get("/editor")
@app.get("/editor/")
def editor_index():
    return send_from_directory(BASE_DIR / "editor", "index.html")


@app.get("/editor/<path:filename>")
def editor_assets(filename: str):
    return send_from_directory(BASE_DIR / "editor", filename)


@app.get("/")
def public_index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.get("/<path:filename>")
def public_assets(filename: str):
    return send_from_directory(PUBLIC_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
