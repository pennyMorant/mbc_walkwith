from __future__ import annotations

from pathlib import Path
from typing import Callable

from .audio import create_transcription_audio, extract_audio, probe_media
from .config import AppConfig
from .models import ProcessingResult
from .output_writer import write_outputs
from .project_store import create_output_files
from .transcriber import transcribe_audio

LogFn = Callable[[str], None]
ProgressFn = Callable[[int], None]


def process_media(
    config: AppConfig,
    source_file: str | Path,
    output_dir: str | Path | None = None,
    log: LogFn | None = None,
    progress: ProgressFn | None = None,
) -> ProcessingResult:
    source = Path(source_file).expanduser().resolve()
    outputs = create_output_files(config.paths.work_dir, source, output_dir)
    _progress(progress, 5)
    _emit(log, f"Inspecting media: {source}")
    media = probe_media(source, config.paths.ffprobe_bin)
    _emit(
        log,
        f"Audio track found: {media.audio_codec}, "
        f"{media.duration_seconds:.1f} seconds",
    )

    _progress(progress, 15)
    _emit(log, "Extracting standard M4A audio...")
    extract_audio(
        source,
        outputs.audio_file,
        media,
        config.paths.ffmpeg_bin,
        config.audio,
    )
    _progress(progress, 35)
    _emit(log, f"Audio saved: {outputs.audio_file}")

    _emit(log, "Preparing temporary transcription audio...")
    create_transcription_audio(
        outputs.audio_file,
        outputs.transcription_audio_file,
        config.paths.ffmpeg_bin,
    )
    _progress(progress, 45)

    try:
        _emit(log, "Transcribing locally with Whisper...")
        transcript = transcribe_audio(
            outputs.transcription_audio_file,
            config.transcription,
        )
    finally:
        outputs.transcription_audio_file.unlink(missing_ok=True)

    _progress(progress, 90)
    _emit(log, "Writing transcript files...")
    write_outputs(source, media, outputs, transcript, config)
    _progress(progress, 100)
    _emit(log, f"Processing complete: {outputs.root}")
    return ProcessingResult(
        source_file=source,
        media=media,
        outputs=outputs,
        transcript=transcript,
    )


def _emit(log: LogFn | None, message: str) -> None:
    if log:
        log(message)


def _progress(progress: ProgressFn | None, value: int) -> None:
    if progress:
        progress(value)
