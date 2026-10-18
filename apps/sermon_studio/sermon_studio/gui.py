from __future__ import annotations

import sys
import threading
from pathlib import Path


def run_gui(config_path: str | Path) -> int:
    try:
        from PySide6.QtCore import QTime, QUrl, Signal
        from PySide6.QtGui import QDesktopServices
        from PySide6.QtWidgets import (
            QApplication,
            QCheckBox,
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
            QTimeEdit,
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
    from .audio import probe_media
    from .media_range import format_time_position

    config = load_config(config_path)

    class MainWindow(QMainWindow):
        log_message = Signal(str)
        output_ready = Signal(str)
        progress_changed = Signal(int)
        processing_finished = Signal()
        media_inspected = Signal(str, float)
        media_inspection_failed = Signal(str, str)

        def __init__(self) -> None:
            super().__init__()
            self.setWindowTitle("Sermon Studio")
            self.resize(860, 620)

            self.source_file = QLineEdit()
            self.output_dir = QLineEdit()
            self.start_time = QTimeEdit(QTime(0, 0, 0))
            self.start_time.setDisplayFormat("HH:mm:ss")
            self.end_time = QTimeEdit(QTime(1, 0, 0))
            self.end_time.setDisplayFormat("HH:mm:ss")
            self.end_at_media_end = QCheckBox("Use media end")
            self.end_at_media_end.setChecked(True)
            self.end_time.setDisabled(True)
            self.end_at_media_end.toggled.connect(self.end_time.setDisabled)
            self.media_duration = QLabel("Select media to inspect duration")
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
            self.media_inspected.connect(self._apply_media_inspection)
            self.media_inspection_failed.connect(self._apply_media_inspection_error)

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
            form.addRow("Start Position", self.start_time)
            form.addRow("End Position", self._end_time_row())
            form.addRow("Media Duration", self.media_duration)

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

        def _end_time_row(self) -> QWidget:
            row = QHBoxLayout()
            row.addWidget(self.end_time)
            row.addWidget(self.end_at_media_end)
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
                self._inspect_source(selected)

        def _inspect_source(self, source: str) -> None:
            self.media_duration.setText("Inspecting media...")

            def worker() -> None:
                try:
                    media = probe_media(source, config.paths.ffprobe_bin)
                    self.media_inspected.emit(source, media.duration_seconds)
                except Exception as error:  # noqa: BLE001
                    self.media_inspection_failed.emit(source, str(error))

            threading.Thread(target=worker, daemon=True).start()

        def _apply_media_inspection(self, source: str, duration: float) -> None:
            if self.source_file.text().strip() != source:
                return
            rounded_duration = min(86_399, round(duration))
            self.end_time.setTime(QTime(0, 0, 0).addSecs(rounded_duration))
            self.media_duration.setText(format_time_position(duration))

        def _apply_media_inspection_error(self, source: str, detail: str) -> None:
            if self.source_file.text().strip() != source:
                return
            self.media_duration.setText(f"Could not inspect media: {detail}")

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
            output_dir = self.output_dir.text().strip() or None
            start_seconds = QTime(0, 0, 0).secsTo(self.start_time.time())
            end_seconds = (
                None
                if self.end_at_media_end.isChecked()
                else QTime(0, 0, 0).secsTo(self.end_time.time())
            )

            def worker() -> None:
                try:
                    result = run_process(
                        config,
                        source,
                        output_dir=output_dir,
                        start_seconds=start_seconds,
                        end_seconds=end_seconds,
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
