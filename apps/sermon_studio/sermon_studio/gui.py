from __future__ import annotations

import sys
import threading
from pathlib import Path


def run_gui(config_path: str | Path) -> int:
    try:
        from PySide6.QtCore import QUrl, Signal
        from PySide6.QtGui import QDesktopServices
        from PySide6.QtWidgets import (
            QApplication,
            QFileDialog,
            QFormLayout,
            QHBoxLayout,
            QLabel,
            QLineEdit,
            QMainWindow,
            QMessageBox,
            QProgressBar,
            QPushButton,
            QPlainTextEdit,
            QVBoxLayout,
            QWidget,
        )
    except ModuleNotFoundError as error:
        raise RuntimeError(
            "PySide6 is not installed. Install with 'pip install -e .[gui]'."
        ) from error

    from .config import load_config
    from .diagnostics import run_diagnostics
    from .main import run_process

    config = load_config(config_path)

    class MainWindow(QMainWindow):
        log_message = Signal(str)
        output_ready = Signal(str)
        progress_changed = Signal(int)
        processing_finished = Signal()

        def __init__(self) -> None:
            super().__init__()
            self.setWindowTitle("Sermon Studio")
            self.resize(860, 620)

            self.source_file = QLineEdit()
            self.output_dir = QLineEdit()
            self.log_view = QPlainTextEdit()
            self.log_view.setReadOnly(True)
            self.progress = QProgressBar()
            self.progress.setRange(0, 100)
            self.process_button = QPushButton("Extract Audio and Transcribe")
            self.open_button = QPushButton("Open Output Folder")
            self.open_button.setEnabled(False)

            self.log_message.connect(self.log_view.appendPlainText)
            self.output_ready.connect(self._set_output_dir)
            self.progress_changed.connect(self.progress.setValue)
            self.processing_finished.connect(self._finish_processing)

            source_button = QPushButton("Browse Media")
            source_button.clicked.connect(self._browse_source)
            output_button = QPushButton("Choose Folder")
            output_button.clicked.connect(self._browse_output)
            doctor_button = QPushButton("Run Doctor")
            doctor_button.clicked.connect(self._run_doctor)
            self.process_button.clicked.connect(self._run_process)
            self.open_button.clicked.connect(self._open_output)

            form = QFormLayout()
            form.addRow(
                "Source Media",
                self._field_row(self.source_file, source_button),
            )
            form.addRow(
                "Output Folder",
                self._field_row(self.output_dir, output_button),
            )

            buttons = QHBoxLayout()
            buttons.addWidget(doctor_button)
            buttons.addWidget(self.process_button)
            buttons.addWidget(self.open_button)

            layout = QVBoxLayout()
            layout.addWidget(QLabel(f"Config: {config_path}"))
            layout.addLayout(form)
            layout.addWidget(self.progress)
            layout.addLayout(buttons)
            layout.addWidget(QLabel("Processing Log"))
            layout.addWidget(self.log_view, stretch=1)

            central = QWidget()
            central.setLayout(layout)
            self.setCentralWidget(central)

        def _field_row(self, field: QLineEdit, button: QPushButton) -> QWidget:
            row = QHBoxLayout()
            row.addWidget(field)
            row.addWidget(button)
            widget = QWidget()
            widget.setLayout(row)
            return widget

        def _browse_source(self) -> None:
            selected, _ = QFileDialog.getOpenFileName(
                self,
                "Select Sermon Media",
                "",
                "Media Files (*.mp4 *.mov *.mkv *.webm *.mp3 *.m4a *.aac *.wav);;All Files (*)",
            )
            if selected:
                self.source_file.setText(selected)

        def _browse_output(self) -> None:
            selected = QFileDialog.getExistingDirectory(
                self,
                "Select Output Folder",
            )
            if selected:
                self.output_dir.setText(selected)

        def _run_doctor(self) -> None:
            self.log_view.clear()
            for item in run_diagnostics(config):
                status = "OK" if item.ok else "FAIL"
                self.log_message.emit(f"[{status}] {item.name}: {item.detail}")

        def _run_process(self) -> None:
            source = self.source_file.text().strip()
            if not source:
                QMessageBox.warning(self, "Missing media", "Source media is required.")
                return
            self.log_view.clear()
            self.progress.setValue(0)
            self.process_button.setEnabled(False)
            self.open_button.setEnabled(False)

            def worker() -> None:
                try:
                    result = run_process(
                        config,
                        source,
                        output_dir=self.output_dir.text().strip() or None,
                        log=self.log_message.emit,
                        progress=self.progress_changed.emit,
                    )
                    self.output_ready.emit(str(result.outputs.root))
                except Exception as error:  # noqa: BLE001
                    self.log_message.emit(f"ERROR: {error}")
                finally:
                    self.processing_finished.emit()

            threading.Thread(target=worker, daemon=True).start()

        def _set_output_dir(self, path: str) -> None:
            self.output_dir.setText(path)
            self.open_button.setEnabled(True)

        def _finish_processing(self) -> None:
            self.process_button.setEnabled(True)

        def _open_output(self) -> None:
            path = self.output_dir.text().strip()
            if path:
                QDesktopServices.openUrl(QUrl.fromLocalFile(path))

    app = QApplication(sys.argv)
    app.setApplicationName("Sermon Studio")
    window = MainWindow()
    window.show()
    return app.exec()
