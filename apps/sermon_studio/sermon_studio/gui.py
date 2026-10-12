from __future__ import annotations

import sys
import threading
from pathlib import Path


def run_gui(config_path: str | Path) -> int:
    try:
        from PySide6.QtCore import Signal
        from PySide6.QtWidgets import (
            QApplication,
            QFileDialog,
            QFormLayout,
            QHBoxLayout,
            QLabel,
            QLineEdit,
            QMainWindow,
            QMessageBox,
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
    from .main import run_process, run_upload
    from .models import SourceInput

    config = load_config(config_path)

    class MainWindow(QMainWindow):
        log_message = Signal(str)
        project_ready = Signal(str)

        def __init__(self) -> None:
            super().__init__()
            self.setWindowTitle("Sermon Studio")
            self.resize(920, 680)

            self.audio_file = QLineEdit()
            self.title_input = QLineEdit()
            self.speaker_input = QLineEdit(config.defaults.speaker)
            self.date_input = QLineEdit()
            self.series_input = QLineEdit(config.defaults.series)
            self.reference_input = QLineEdit(config.defaults.primary_reference)
            self.project_root = QLineEdit()
            self.log_view = QPlainTextEdit()
            self.log_view.setReadOnly(True)
            self.log_message.connect(self.log_view.appendPlainText)
            self.project_ready.connect(self.project_root.setText)

            browse_button = QPushButton("Browse Audio")
            browse_button.clicked.connect(self._browse_audio)

            doctor_button = QPushButton("Run Doctor")
            doctor_button.clicked.connect(self._run_doctor)

            process_button = QPushButton("Process")
            process_button.clicked.connect(self._run_process)

            upload_button = QPushButton("Upload Package")
            upload_button.clicked.connect(self._run_upload)

            form = QFormLayout()
            audio_row = QHBoxLayout()
            audio_row.addWidget(self.audio_file)
            audio_row.addWidget(browse_button)
            audio_widget = QWidget()
            audio_widget.setLayout(audio_row)
            form.addRow("Local Audio", audio_widget)
            form.addRow("Title", self.title_input)
            form.addRow("Speaker", self.speaker_input)
            form.addRow("Date (YYYY-MM-DD)", self.date_input)
            form.addRow("Series", self.series_input)
            form.addRow("Primary Reference", self.reference_input)
            form.addRow("Project Root", self.project_root)

            buttons = QHBoxLayout()
            buttons.addWidget(doctor_button)
            buttons.addWidget(process_button)
            buttons.addWidget(upload_button)

            layout = QVBoxLayout()
            layout.addWidget(QLabel(f"Config: {config_path}"))
            layout.addLayout(form)
            layout.addLayout(buttons)
            layout.addWidget(QLabel("Log"))
            layout.addWidget(self.log_view, stretch=1)

            central = QWidget()
            central.setLayout(layout)
            self.setCentralWidget(central)

        def _append_log(self, message: str) -> None:
            self.log_message.emit(message)

        def _browse_audio(self) -> None:
            selected, _ = QFileDialog.getOpenFileName(
                self,
                "Select Audio File",
                "",
                "Audio Files (*.mp3 *.wav *.m4a *.aac);;All Files (*)",
            )
            if selected:
                self.audio_file.setText(selected)

        def _run_doctor(self) -> None:
            self.log_view.clear()
            for item in run_diagnostics(config):
                status = "OK" if item.ok else "FAIL"
                self._append_log(f"[{status}] {item.name}: {item.detail}")

        def _run_process(self) -> None:
            source = SourceInput(
                source_type="local_file",
                local_file=self.audio_file.text().strip() or None,
                title=self.title_input.text().strip(),
                speaker=self.speaker_input.text().strip(),
                sermon_date=self.date_input.text().strip(),
                series=self.series_input.text().strip() or None,
                primary_reference=self.reference_input.text().strip() or None,
            )

            def worker() -> None:
                try:
                    project = run_process(config, source, log=self._append_log)
                    self.project_ready.emit(str(project.root))
                    self._append_log(f"Created project: {project.root}")
                except Exception as error:  # noqa: BLE001
                    self._append_log(f"ERROR: {error}")

            threading.Thread(target=worker, daemon=True).start()

        def _run_upload(self) -> None:
            project_root = self.project_root.text().strip()
            if not project_root:
                QMessageBox.warning(self, "Missing project", "Project Root is required.")
                return

            def worker() -> None:
                try:
                    result = run_upload(config, project_root, log=self._append_log)
                    self._append_log(f"Upload complete: {result}")
                except Exception as error:  # noqa: BLE001
                    self._append_log(f"ERROR: {error}")

            threading.Thread(target=worker, daemon=True).start()

    app = QApplication(sys.argv)
    app.setApplicationName("Sermon Studio")
    window = MainWindow()
    window.show()
    return app.exec()
