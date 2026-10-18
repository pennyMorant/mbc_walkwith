from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from PySide6.QtCore import QObject, Signal, Slot

from ..audio import probe_media
from ..config import AppConfig
from ..main import run_process
from ..processing_control import CancellationToken, ProcessingCancelled


class ProbeJob(QObject):
    succeeded = Signal(str, object)
    failed = Signal(str, str)
    finished = Signal()

    def __init__(self, source: str, config: AppConfig) -> None:
        super().__init__()
        self.source = source
        self.config = config

    @Slot()
    def run(self) -> None:
        try:
            media = probe_media(self.source, self.config.paths.ffprobe_bin)
            self.succeeded.emit(self.source, media)
        except Exception as error:  # noqa: BLE001
            self.failed.emit(self.source, str(error))
        finally:
            self.finished.emit()


class ProcessingJob(QObject):
    log = Signal(str)
    progress = Signal(int)
    stage = Signal(str)
    succeeded = Signal(object)
    failed = Signal(str)
    cancelled = Signal()
    finished = Signal()

    def __init__(
        self,
        config: AppConfig,
        source: str,
        output_dir: str | None,
        start_seconds: float,
        end_seconds: float | None,
        model: str,
        language: str | None,
    ) -> None:
        super().__init__()
        transcription = replace(config.transcription, model=model, language=language)
        self.config = replace(config, transcription=transcription)
        self.source = source
        self.output_dir = output_dir
        self.start_seconds = start_seconds
        self.end_seconds = end_seconds
        self.token = CancellationToken()

    def cancel(self) -> None:
        self.token.cancel()

    @Slot()
    def run(self) -> None:
        try:
            result = run_process(
                self.config,
                self.source,
                output_dir=self.output_dir,
                start_seconds=self.start_seconds,
                end_seconds=self.end_seconds,
                log=self.log.emit,
                progress=self.progress.emit,
                cancellation=self.token,
                stage=self.stage.emit,
            )
            self.succeeded.emit(result)
        except ProcessingCancelled:
            self.cancelled.emit()
        except Exception as error:  # noqa: BLE001
            self.failed.emit(str(error))
        finally:
            self.finished.emit()
