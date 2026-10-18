from __future__ import annotations

from pathlib import Path


def run_gui(config_path: str | Path) -> int:
    try:
        from .app import run_gui_app
    except ModuleNotFoundError as error:
        if error.name and error.name.startswith("PySide6"):
            raise RuntimeError(
                "PySide6 is not installed. Install with 'pip install -e .[gui]'."
            ) from error
        raise
    return run_gui_app(config_path)


__all__ = ["run_gui"]
