from __future__ import annotations

import sys
from pathlib import Path

from PySide6.QtWidgets import QApplication

from ..config import load_config
from .main_window import MainWindow


def run_gui_app(config_path: str | Path) -> int:
    app = QApplication(sys.argv)
    app.setApplicationName("Sermon Studio")
    app.setOrganizationName("MBCG")
    window = MainWindow(load_config(config_path), Path(config_path).resolve())
    window.show()
    return app.exec()
