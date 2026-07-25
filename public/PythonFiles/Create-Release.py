from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_PATH = PROJECT_ROOT / "ITGuideTool-release.zip"
EXCLUDED_DIRS = {".git", "__pycache__"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo"}


def should_exclude(path):
    relative = path.relative_to(PROJECT_ROOT)
    if any(part in EXCLUDED_DIRS for part in relative.parts):
        return True
    if path.suffix in EXCLUDED_SUFFIXES:
        return True
    if path == ARCHIVE_PATH:
        return True
    return False


def main():
    with ZipFile(ARCHIVE_PATH, "w", ZIP_DEFLATED) as archive:
        for path in PROJECT_ROOT.rglob("*"):
            if path.is_dir() or should_exclude(path):
                continue
            archive.write(path, path.relative_to(PROJECT_ROOT))
    print("Created", ARCHIVE_PATH)


if __name__ == "__main__":
    main()
