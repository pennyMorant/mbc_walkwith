from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Callable

from .audio import create_transcription_audio, extract_audio, probe_media
from .config import AppConfig
from .media_range import format_time_position, resolve_media_range
from .models import ProcessingResult
from .output_writer import write_outputs
from .project_store import create_output_files, publish_output_files
from .processing_control import CancellationToken
from .transcriber import transcribe_audio

LogFn = Callable[[str], None]
ProgressFn = Callable[[int], None]
StageFn = Callable[[str], None]


def process_media(
    config: AppConfig,
    source_file: str | Path,
    output_dir: str | Path | None = None,
    start_seconds: float = 0,
    end_seconds: float | None = None,
    log: LogFn | None = None,
    progress: ProgressFn | None = None,
    cancellation: CancellationToken | None = None,
    stage: StageFn | None = None,
) -> ProcessingResult:
    cancellation = cancellation or CancellationToken()
    cancellation.raise_if_cancelled()
    source = Path(source_file).expanduser().resolve()
    outputs = create_output_files(config.paths.work_dir, source, output_dir)
    if source == outputs.audio_file:
        raise ValueError("The output audio path must not replace the source media.")
    _stage(stage, "inspecting")
    _progress(progress, 5)
    _emit(log, f"Inspecting media: {source}")
    media = probe_media(source, config.paths.ffprobe_bin)
    media_range = resolve_media_range(
        media.duration_seconds,
        start_seconds=start_seconds,
        end_seconds=end_seconds,
    )
    _emit(
        log,
        f"Audio track found: {media.audio_codec}, "
        f"{media.duration_seconds:.1f} seconds",
    )
    _emit(
        log,
        "Processing range: "
        f"{format_time_position(media_range.start_seconds)} - "
        f"{format_time_position(media_range.end_seconds)}",
    )

    with tempfile.TemporaryDirectory(
        prefix=".sermon-studio-stage-",
        dir=outputs.root.parent,
    ) as staging_name:
        staged = create_output_files(
            config.paths.work_dir,
            source,
            output_dir=staging_name,
        )
        _stage(stage, "extracting")
        _progress(progress, 15)
        _emit(log, "Extracting standard M4A audio...")
        extract_audio(
            source,
            staged.audio_file,
            media,
            config.paths.ffmpeg_bin,
            config.audio,
            media_range,
            progress=lambda value: _progress(progress, 15 + round(value * 20)),
            cancellation=cancellation,
        )
        _progress(progress, 35)
        _emit(log, "Audio extraction complete.")

        _stage(stage, "preparing_audio")
        _emit(log, "Preparing temporary transcription audio...")
        create_transcription_audio(
            staged.audio_file,
            staged.transcription_audio_file,
            config.paths.ffmpeg_bin,
            duration_seconds=media_range.duration_seconds,
            progress=lambda value: _progress(progress, 35 + round(value * 10)),
            cancellation=cancellation,
        )
        _progress(progress, 45)

        try:
            _stage(stage, "transcribing")
            _emit(log, "Transcribing locally with Whisper...")
            transcript = transcribe_audio(
                staged.transcription_audio_file,
                config.transcription,
                duration_seconds=media_range.duration_seconds,
                progress=lambda value: _progress(progress, 45 + round(value * 45)),
                cancellation=cancellation,
            )
        finally:
            staged.transcription_audio_file.unlink(missing_ok=True)

        _progress(progress, 90)
        _stage(stage, "writing_outputs")
        _emit(log, "Writing transcript files...")
        cancellation.raise_if_cancelled()
        write_outputs(source, media, media_range, staged, transcript, config)
        publish_output_files(staged, outputs)

    _progress(progress, 100)
    _stage(stage, "completed")
    _emit(log, f"Processing complete: {outputs.root}")
    return ProcessingResult(
        source_file=source,
        media=media,
        media_range=media_range,
        outputs=outputs,
        transcript=transcript,
    )


def _emit(log: LogFn | None, message: str) -> None:
    if log:
        log(message)


def _progress(progress: ProgressFn | None, value: int) -> None:
    if progress:
        progress(value)


def _stage(stage: StageFn | None, value: str) -> None:
    if stage:
        stage(value)
