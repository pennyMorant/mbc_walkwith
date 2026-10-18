from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

from .audio import sha256_file
from .config import AppConfig
from .models import (
    MediaProbe,
    MediaRange,
    OutputFiles,
    TranscriptPayload,
    TranscriptSegment,
)


def write_outputs(
    source_file: Path,
    media: MediaProbe,
    media_range: MediaRange,
    outputs: OutputFiles,
    transcript: TranscriptPayload,
    config: AppConfig,
) -> None:
    text = transcript.text.strip() + "\n"
    outputs.transcript_text_file.write_text(text, encoding="utf-8")
    outputs.transcript_markdown_file.write_text(
        _build_markdown(source_file.stem, transcript),
        encoding="utf-8",
    )
    outputs.transcript_srt_file.write_text(
        _build_srt(transcript.segments),
        encoding="utf-8",
    )
    outputs.processing_info_file.write_text(
        json.dumps(
            {
                "source": {
                    "fileName": source_file.name,
                    "sha256": sha256_file(source_file),
                    "format": media.format_name,
                    "durationSeconds": round(media.duration_seconds, 3),
                    "audioStreamIndex": media.audio_stream_index,
                    "audioCodec": media.audio_codec,
                    "channels": media.channels,
                    "sampleRate": media.sample_rate,
                },
                "audio": {
                    "fileName": outputs.audio_file.name,
                    "sha256": sha256_file(outputs.audio_file),
                    "codec": config.audio.codec,
                    "bitrate": config.audio.bitrate,
                    "sampleRate": config.audio.sample_rate,
                    "channels": config.audio.channels,
                    "durationSeconds": round(media_range.duration_seconds, 3),
                    "sourceRange": {
                        "startSeconds": round(media_range.start_seconds, 3),
                        "endSeconds": round(media_range.end_seconds, 3),
                    },
                },
                "transcription": {
                    "source": transcript.source,
                    "language": transcript.language,
                    "segmentCount": len(transcript.segments),
                },
                "generatedAt": datetime.now(UTC).isoformat(),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def save_reviewed_transcript(
    outputs: OutputFiles,
    title: str,
    transcript: TranscriptPayload,
) -> None:
    text = transcript.text.strip()
    _atomic_write(outputs.transcript_text_file, text + "\n")
    _atomic_write(
        outputs.transcript_markdown_file,
        _build_markdown(title, transcript),
    )


def _atomic_write(path: Path, content: str) -> None:
    temporary = path.with_name(f".{path.name}.saving")
    temporary.write_text(content, encoding="utf-8")
    temporary.replace(path)


def _build_markdown(title: str, transcript: TranscriptPayload) -> str:
    language = transcript.language or "unknown"
    return (
        f"# {title}\n\n"
        f"> Transcribed locally with `{transcript.source}`. "
        f"Detected language: `{language}`.\n\n"
        "## Transcript\n\n"
        f"{transcript.text.strip()}\n"
    )


def _build_srt(segments: list[TranscriptSegment]) -> str:
    blocks = [
        "\n".join(
            [
                str(index),
                f"{_srt_timestamp(segment.start_seconds)} --> "
                f"{_srt_timestamp(segment.end_seconds)}",
                segment.text,
            ]
        )
        for index, segment in enumerate(segments, start=1)
    ]
    return "\n\n".join(blocks).strip() + "\n"


def _srt_timestamp(seconds: float) -> str:
    milliseconds = max(0, round(seconds * 1000))
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    whole_seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02}:{minutes:02}:{whole_seconds:02},{milliseconds:03}"
