from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any, Callable

from .config import AudioConfig
from .models import MediaProbe, MediaRange
from .processing_control import CancellationToken, ProcessingCancelled

PROBE_TIMEOUT_SECONDS = 30
FfmpegProgressFn = Callable[[float], None]


def probe_media(source_path: str | Path, ffprobe_bin: str) -> MediaProbe:
    source = _require_source_file(source_path)
    command = [
        ffprobe_bin,
        "-v",
        "error",
        "-show_format",
        "-show_streams",
        "-of",
        "json",
        str(source),
    ]
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            timeout=PROBE_TIMEOUT_SECONDS,
        )
        payload = json.loads(result.stdout)
    except subprocess.TimeoutExpired as error:
        raise RuntimeError("Media inspection timed out after 30 seconds.") from error
    except (subprocess.CalledProcessError, json.JSONDecodeError) as error:
        raise RuntimeError("The selected media file could not be inspected.") from error
    if not isinstance(payload, dict):
        raise RuntimeError("The selected media file returned invalid metadata.")

    streams = payload.get("streams")
    if not isinstance(streams, list):
        raise RuntimeError("The selected media file has no readable streams.")
    audio_stream = next(
        (
            stream
            for stream in streams
            if isinstance(stream, dict) and stream.get("codec_type") == "audio"
        ),
        None,
    )
    if audio_stream is None:
        raise RuntimeError("The selected media file does not contain an audio track.")

    format_metadata = payload.get("format")
    if not isinstance(format_metadata, dict):
        format_metadata = {}
    duration = _positive_float(format_metadata.get("duration"))
    if duration is None:
        duration = _positive_float(audio_stream.get("duration"))
    if duration is None:
        raise RuntimeError("The media duration could not be determined.")

    stream_index = _optional_nonnegative_int(audio_stream.get("index"))
    if stream_index is None:
        raise RuntimeError("The audio stream index could not be determined.")

    return MediaProbe(
        duration_seconds=duration,
        audio_stream_index=stream_index,
        audio_codec=str(audio_stream.get("codec_name") or "unknown"),
        channels=_optional_positive_int(audio_stream.get("channels")),
        sample_rate=_optional_positive_int(audio_stream.get("sample_rate")),
        format_name=str(format_metadata.get("format_name") or "unknown"),
    )


def extract_audio(
    source_path: str | Path,
    output_path: str | Path,
    media: MediaProbe,
    ffmpeg_bin: str,
    config: AudioConfig,
    media_range: MediaRange,
    progress: FfmpegProgressFn | None = None,
    cancellation: CancellationToken | None = None,
) -> Path:
    source = _require_source_file(source_path)
    output = Path(output_path).expanduser().resolve()
    if source == output:
        raise ValueError("The output audio path must not replace the source media.")
    command = [
        ffmpeg_bin,
        "-y",
        "-ss",
        _ffmpeg_time(media_range.start_seconds),
        "-i",
        str(source),
        "-t",
        _ffmpeg_time(media_range.duration_seconds),
        "-map",
        f"0:{media.audio_stream_index}",
        "-vn",
        "-c:a",
        config.codec,
        "-b:a",
        config.bitrate,
        "-ar",
        str(config.sample_rate),
        "-ac",
        str(config.channels),
        "-movflags",
        "+faststart",
    ]
    return _run_ffmpeg(
        command,
        output,
        "Audio extraction failed.",
        expected_duration=media_range.duration_seconds,
        progress=progress,
        cancellation=cancellation,
    )


def create_transcription_audio(
    source_audio_path: str | Path,
    output_path: str | Path,
    ffmpeg_bin: str,
    duration_seconds: float | None = None,
    progress: FfmpegProgressFn | None = None,
    cancellation: CancellationToken | None = None,
) -> Path:
    source = _require_source_file(source_audio_path)
    output = Path(output_path).expanduser().resolve()
    command = [
        ffmpeg_bin,
        "-y",
        "-i",
        str(source),
        "-vn",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
    ]
    return _run_ffmpeg(
        command,
        output,
        "Transcription audio conversion failed.",
        expected_duration=duration_seconds,
        progress=progress,
        cancellation=cancellation,
    )


def sha256_file(path: str | Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _run_ffmpeg(
    command: list[str],
    output: Path,
    message: str,
    expected_duration: float | None = None,
    progress: FfmpegProgressFn | None = None,
    cancellation: CancellationToken | None = None,
) -> Path:
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_name(f".{output.stem}.partial{output.suffix}")
    temporary.unlink(missing_ok=True)
    try:
        if progress is None and cancellation is None:
            subprocess.run(
                [*command, str(temporary)],
                check=True,
                capture_output=True,
                text=True,
            )
        else:
            _run_ffmpeg_with_progress(
                command,
                temporary,
                message,
                expected_duration,
                progress,
                cancellation or CancellationToken(),
            )
        if not temporary.is_file() or temporary.stat().st_size == 0:
            raise RuntimeError(f"{message} FFmpeg produced an empty file.")
        temporary.replace(output)
    except subprocess.CalledProcessError as error:
        temporary.unlink(missing_ok=True)
        detail = (error.stderr or "").strip().splitlines()[-1:]
        suffix = f" {' '.join(detail)}" if detail else ""
        raise RuntimeError(f"{message}{suffix}") from error
    except Exception:
        temporary.unlink(missing_ok=True)
        raise
    return output


def _run_ffmpeg_with_progress(
    command: list[str],
    output: Path,
    message: str,
    expected_duration: float | None,
    progress: FfmpegProgressFn | None,
    cancellation: CancellationToken,
) -> None:
    cancellation.raise_if_cancelled()
    process = subprocess.Popen(
        [
            command[0],
            "-hide_banner",
            "-loglevel",
            "error",
            *command[1:],
            "-progress",
            "pipe:1",
            "-nostats",
            str(output),
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    cancellation.bind_process(process)
    try:
        if process.stdout is not None:
            for line in process.stdout:
                cancellation.raise_if_cancelled()
                _report_ffmpeg_progress(line, expected_duration, progress)
        stderr = process.stderr.read() if process.stderr is not None else ""
        return_code = process.wait()
        if cancellation.is_cancelled:
            raise ProcessingCancelled("Processing was cancelled.")
        if return_code != 0:
            detail = stderr.strip().splitlines()[-1:]
            suffix = f" {' '.join(detail)}" if detail else ""
            raise RuntimeError(f"{message}{suffix}")
        if progress:
            progress(1.0)
    finally:
        cancellation.release_process(process)


def _report_ffmpeg_progress(
    line: str,
    expected_duration: float | None,
    progress: FfmpegProgressFn | None,
) -> None:
    if progress is None or not expected_duration or expected_duration <= 0:
        return
    key, separator, value = line.strip().partition("=")
    if not separator or key not in {"out_time_us", "out_time_ms"}:
        return
    try:
        elapsed_seconds = int(value) / 1_000_000
    except ValueError:
        return
    progress(min(1.0, max(0.0, elapsed_seconds / expected_duration)))


def _require_source_file(path: str | Path) -> Path:
    source = Path(path).expanduser().resolve()
    if not source.is_file():
        raise FileNotFoundError(f"Media file not found: {source}")
    return source


def _positive_float(value: Any) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def _optional_positive_int(value: Any) -> int | None:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def _optional_nonnegative_int(value: Any) -> int | None:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed >= 0 else None


def _ffmpeg_time(seconds: float) -> str:
    return f"{seconds:.3f}".rstrip("0").rstrip(".")
