from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class MediaProbe:
    duration_seconds: float
    audio_stream_index: int
    audio_codec: str
    channels: int | None
    sample_rate: int | None
    format_name: str


@dataclass(frozen=True)
class TranscriptSegment:
    start_seconds: float
    end_seconds: float
    text: str


@dataclass(frozen=True)
class TranscriptPayload:
    text: str
    source: str
    language: str | None = None
    segments: list[TranscriptSegment] = field(default_factory=list)


@dataclass(frozen=True)
class OutputFiles:
    root: Path
    audio_file: Path
    transcription_audio_file: Path
    transcript_text_file: Path
    transcript_markdown_file: Path
    transcript_srt_file: Path
    processing_info_file: Path


@dataclass(frozen=True)
class ProcessingResult:
    source_file: Path
    media: MediaProbe
    outputs: OutputFiles
    transcript: TranscriptPayload
