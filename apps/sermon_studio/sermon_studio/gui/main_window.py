from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from PySide6.QtCore import QThread, QTime, QUrl
from PySide6.QtGui import QDesktopServices
from PySide6.QtWidgets import (
    QComboBox, QFileDialog, QFormLayout, QHBoxLayout, QLabel, QLineEdit,
    QMainWindow, QMessageBox, QProgressBar, QPushButton, QPlainTextEdit,
    QSplitter, QTimeEdit, QVBoxLayout, QWidget,
)

from ..config import AppConfig
from ..diagnostics import run_diagnostics
from ..media_range import format_time_position
from ..models import MediaProbe, ProcessingResult
from ..output_writer import save_reviewed_transcript
from ..settings_store import SettingsStore, StudioSettings
from .job_controller import ProbeJob, ProcessingJob
from .media_preview import MediaPreview
from .transcript_editor import TranscriptEditor


class MainWindow(QMainWindow):
    def __init__(self, config: AppConfig, config_path: Path) -> None:
        super().__init__()
        self.config = config
        self.config_path = config_path
        self.result: ProcessingResult | None = None
        self.processing_job: ProcessingJob | None = None
        self._threads: list[QThread] = []
        self._duration_seconds = 0.0
        self.settings_store = SettingsStore()
        self.settings = self.settings_store.load()
        self.setWindowTitle("Sermon Studio")
        self.resize(1180, 760)

        self.source_field = QLineEdit()
        self.output_field = QLineEdit()
        self.output_field.setText(self.settings.output_dir)
        self.recent_sources = QComboBox()
        self.recent_sources.addItem("Recent recordings", "")
        for source in self.settings.recent_sources:
            self.recent_sources.addItem(Path(source).name, source)
        self.media_summary = QLabel("Choose a sermon recording to begin.")
        self.preview = MediaPreview()
        self.start_time = _time_editor()
        self.end_time = _time_editor()
        self.end_time.setTime(QTime(1, 0, 0))
        self.model = QComboBox()
        self.model.addItems(["small", "medium", "large-v3"])
        self.model.setCurrentText(config.transcription.model)
        if self.settings.model:
            self.model.setCurrentText(self.settings.model)
        self.language = QComboBox()
        for label, value in (
            ("Auto detect", None), ("Chinese", "zh"),
            ("English", "en"), ("Spanish", "es"),
        ):
            self.language.addItem(label, value)
        _select_data(self.language, config.transcription.language)
        if self.settings.language:
            _select_data(self.language, self.settings.language)
        self.progress = QProgressBar()
        self.progress.setRange(0, 100)
        self.progress.setValue(0)
        self.status = QLabel("Ready")
        self.log_view = QPlainTextEdit(readOnly=True)
        self.transcript = TranscriptEditor()
        self.process_button = QPushButton("Extract and Transcribe")
        self.cancel_button = QPushButton("Cancel", enabled=False)
        self.open_button = QPushButton("Open Output", enabled=False)
        self._build_ui()
        self._connect_actions()

    def _build_ui(self) -> None:
        source_button = QPushButton("Browse")
        source_button.clicked.connect(self._browse_source)
        output_button = QPushButton("Choose")
        output_button.clicked.connect(self._browse_output)
        set_start = QPushButton("Set from Player")
        set_start.clicked.connect(lambda: self._set_editor_time(self.start_time))
        set_end = QPushButton("Set from Player")
        set_end.clicked.connect(lambda: self._set_editor_time(self.end_time))
        media_end = QPushButton("Use Media End")
        media_end.clicked.connect(self._use_media_end)

        form = QFormLayout()
        form.addRow("Recent", self.recent_sources)
        form.addRow("Source media", _row(self.source_field, source_button))
        form.addRow("Output folder", _row(self.output_field, output_button))
        form.addRow("Start", _row(self.start_time, set_start))
        form.addRow("End", _row(self.end_time, set_end, media_end))
        form.addRow("Whisper model", self.model)
        form.addRow("Language", self.language)
        doctor = QPushButton("Run Doctor")
        doctor.clicked.connect(self._run_doctor)
        actions = QHBoxLayout()
        actions.addWidget(doctor)
        actions.addStretch()
        actions.addWidget(self.cancel_button)
        actions.addWidget(self.process_button)
        actions.addWidget(self.open_button)

        left = QWidget()
        left_layout = QVBoxLayout(left)
        left_layout.addWidget(QLabel(f"Config: {self.config_path}"))
        left_layout.addLayout(form)
        left_layout.addWidget(self.media_summary)
        left_layout.addWidget(self.preview, 1)
        left_layout.addWidget(self.status)
        left_layout.addWidget(self.progress)
        left_layout.addLayout(actions)
        left_layout.addWidget(QLabel("Processing log"))
        left_layout.addWidget(self.log_view, 1)
        splitter = QSplitter()
        splitter.addWidget(left)
        splitter.addWidget(self.transcript)
        splitter.setSizes([650, 530])
        self.setCentralWidget(splitter)

    def _connect_actions(self) -> None:
        self.process_button.clicked.connect(self._start_processing)
        self.cancel_button.clicked.connect(self._cancel_processing)
        self.open_button.clicked.connect(self._open_output)
        self.transcript.save_requested.connect(self._save_transcript)
        self.recent_sources.currentIndexChanged.connect(self._load_recent_source)

    def _browse_source(self) -> None:
        selected, _ = QFileDialog.getOpenFileName(
            self, "Select Sermon Media", "",
            "Media (*.mp4 *.mov *.mkv *.webm *.mp3 *.m4a *.aac *.wav);;All (*)",
        )
        if not selected:
            return
        self._load_source(selected)

    def _load_source(self, selected: str) -> None:
        self.source_field.setText(selected)
        self.preview.load(selected)
        self.media_summary.setText("Inspecting media...")
        job = ProbeJob(selected, self.config)
        job.succeeded.connect(self._media_ready)
        job.failed.connect(self._media_failed)
        self._start_thread(job)

    def _media_ready(self, source: str, media: MediaProbe) -> None:
        if source != self.source_field.text().strip():
            return
        self._duration_seconds = media.duration_seconds
        self._use_media_end()
        self.media_summary.setText(
            f"{format_time_position(media.duration_seconds)} | "
            f"{media.audio_codec} | {media.channels or '?'} channels"
        )

    def _media_failed(self, source: str, detail: str) -> None:
        if source == self.source_field.text().strip():
            self.media_summary.setText(f"Inspection failed: {detail}")

    def _browse_output(self) -> None:
        selected = QFileDialog.getExistingDirectory(self, "Select Output Folder")
        if selected:
            self.output_field.setText(selected)

    def _start_processing(self) -> None:
        source = self.source_field.text().strip()
        if not Path(source).is_file():
            QMessageBox.warning(self, "Missing media", "Choose a valid media file.")
            return
        start, end = _seconds(self.start_time.time()), _seconds(self.end_time.time())
        if end <= start:
            QMessageBox.warning(self, "Invalid range", "End must be after start.")
            return
        self.result = None
        self.progress.setValue(0)
        self.log_view.clear()
        self._set_busy(True)
        job = ProcessingJob(
            self.config, source, self.output_field.text().strip() or None,
            start, end, self.model.currentText(), self.language.currentData(),
        )
        self.processing_job = job
        job.log.connect(self.log_view.appendPlainText)
        job.progress.connect(self.progress.setValue)
        job.stage.connect(lambda value: self.status.setText(_stage_label(value)))
        job.succeeded.connect(self._processing_succeeded)
        job.failed.connect(self._processing_failed)
        job.cancelled.connect(lambda: self.status.setText("Cancelled"))
        job.finished.connect(self._processing_finished)
        self._start_thread(job)

    def _processing_succeeded(self, result: ProcessingResult) -> None:
        self.result = result
        self.output_field.setText(str(result.outputs.root))
        self.transcript.set_transcript(result.transcript.text)
        self.open_button.setEnabled(True)
        self._save_settings(result.source_file)

    def _processing_failed(self, detail: str) -> None:
        self.status.setText("Failed")
        self.log_view.appendPlainText(f"ERROR: {detail}")
        QMessageBox.critical(self, "Processing failed", detail)

    def _processing_finished(self) -> None:
        self.processing_job = None
        self._set_busy(False)

    def _cancel_processing(self) -> None:
        if self.processing_job:
            self.status.setText("Cancelling...")
            self.processing_job.cancel()

    def _save_transcript(self, text: str) -> None:
        if not self.result:
            return
        revised = replace(self.result.transcript, text=text)
        save_reviewed_transcript(
            self.result.outputs, self.result.source_file.stem, revised,
        )
        self.result = replace(self.result, transcript=revised)
        self.status.setText("Reviewed transcript saved")

    def _run_doctor(self) -> None:
        self.log_view.clear()
        for item in run_diagnostics(self.config):
            status = "OK" if item.ok else "FAIL"
            self.log_view.appendPlainText(f"[{status}] {item.name}: {item.detail}")

    def _open_output(self) -> None:
        path = self.output_field.text().strip()
        if path:
            QDesktopServices.openUrl(QUrl.fromLocalFile(path))

    def _set_editor_time(self, editor: QTimeEdit) -> None:
        editor.setTime(QTime(0, 0).addSecs(round(self.preview.position_seconds)))

    def _use_media_end(self) -> None:
        self.end_time.setTime(QTime(0, 0).addSecs(round(self._duration_seconds)))

    def _set_busy(self, busy: bool) -> None:
        self.process_button.setEnabled(not busy)
        self.cancel_button.setEnabled(busy)

    def _load_recent_source(self) -> None:
        source = str(self.recent_sources.currentData() or "")
        if source and Path(source).is_file():
            self._load_source(source)

    def _save_settings(self, source: Path) -> None:
        recent = [str(source)] + [
            value for value in self.settings.recent_sources if value != str(source)
        ]
        self.settings = StudioSettings(
            output_dir=self.output_field.text().strip(),
            model=self.model.currentText(),
            language=self.language.currentData(),
            recent_sources=recent[:10],
        )
        self.settings_store.save(self.settings)

    def _start_thread(self, job: object) -> None:
        thread = QThread(self)
        self._threads.append(thread)
        job.moveToThread(thread)  # type: ignore[attr-defined]
        thread.started.connect(job.run)  # type: ignore[attr-defined]
        job.finished.connect(thread.quit)  # type: ignore[attr-defined]
        job.finished.connect(job.deleteLater)  # type: ignore[attr-defined]
        thread.finished.connect(thread.deleteLater)
        thread.finished.connect(lambda: self._threads.remove(thread))
        thread.start()


def _time_editor() -> QTimeEdit:
    editor = QTimeEdit(QTime(0, 0, 0))
    editor.setDisplayFormat("HH:mm:ss")
    return editor


def _row(*widgets: QWidget) -> QWidget:
    container = QWidget()
    layout = QHBoxLayout(container)
    layout.setContentsMargins(0, 0, 0, 0)
    for widget in widgets:
        layout.addWidget(widget, 1 if isinstance(widget, QLineEdit) else 0)
    return container


def _seconds(value: QTime) -> int:
    return QTime(0, 0).secsTo(value)


def _select_data(combo: QComboBox, value: object) -> None:
    index = combo.findData(value)
    if index >= 0:
        combo.setCurrentIndex(index)


def _stage_label(value: str) -> str:
    return {
        "inspecting": "Inspecting media", "extracting": "Extracting audio",
        "preparing_audio": "Preparing transcription audio",
        "transcribing": "Transcribing locally",
        "writing_outputs": "Writing outputs", "completed": "Complete",
    }.get(value, value.replace("_", " ").title())
