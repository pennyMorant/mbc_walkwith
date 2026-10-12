from __future__ import annotations

import importlib.util
import shutil
from dataclasses import dataclass
from typing import Iterable

from .config import AppConfig


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str


def run_diagnostics(config: AppConfig) -> list[CheckResult]:
    results = [
        _binary_check("ffmpeg", config.paths.ffmpeg_bin),
        _binary_check("ffprobe", config.paths.ffprobe_bin),
        _python_import_check("PyYAML", "yaml"),
        _python_import_check("httpx", "httpx"),
    ]

    if config.transcription.provider.startswith("faster-whisper"):
        results.append(_python_import_check("faster-whisper", "faster_whisper"))

    if config.summary.provider == "ollama":
        results.append(_binary_check("ollama", "ollama"))
    elif config.summary.provider == "openai":
        results.append(
            CheckResult(
                name="openai-api-key",
                ok=bool(config.summary.api_key),
                detail="Configured" if config.summary.api_key else "Missing api_key",
            )
        )
    elif config.summary.provider == "gemini":
        results.append(
            CheckResult(
                name="gemini-api-key",
                ok=bool(config.summary.api_key),
                detail="Configured" if config.summary.api_key else "Missing api_key",
            )
        )

    return results


def summarize_diagnostics(results: Iterable[CheckResult]) -> tuple[bool, str]:
    items = list(results)
    failed = [item for item in items if not item.ok]
    if not failed:
        return True, "All checks passed."
    return False, "; ".join(f"{item.name}: {item.detail}" for item in failed)


def _binary_check(name: str, binary: str) -> CheckResult:
    resolved = shutil.which(binary)
    return CheckResult(
        name=name,
        ok=resolved is not None,
        detail=resolved or f"'{binary}' not found on PATH",
    )


def _python_import_check(name: str, module_name: str) -> CheckResult:
    spec = importlib.util.find_spec(module_name)
    return CheckResult(
        name=name,
        ok=spec is not None,
        detail="Importable" if spec else f"Module '{module_name}' not installed",
    )
