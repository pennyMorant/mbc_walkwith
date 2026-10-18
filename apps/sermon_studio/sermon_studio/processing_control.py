from __future__ import annotations

import subprocess
import threading


class ProcessingCancelled(RuntimeError):
    pass


class CancellationToken:
    def __init__(self) -> None:
        self._cancelled = threading.Event()
        self._lock = threading.Lock()
        self._process: subprocess.Popen[str] | None = None

    @property
    def is_cancelled(self) -> bool:
        return self._cancelled.is_set()

    def cancel(self) -> None:
        self._cancelled.set()
        with self._lock:
            process = self._process
        if process is not None and process.poll() is None:
            process.terminate()

    def raise_if_cancelled(self) -> None:
        if self.is_cancelled:
            raise ProcessingCancelled("Processing was cancelled.")

    def bind_process(self, process: subprocess.Popen[str]) -> None:
        with self._lock:
            self._process = process
        if self.is_cancelled and process.poll() is None:
            process.terminate()

    def release_process(self, process: subprocess.Popen[str]) -> None:
        with self._lock:
            if self._process is process:
                self._process = None
