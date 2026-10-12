from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal


SourceType = Literal["local_file"]


@dataclass
class SourceInput:
    source_type: SourceType
    title: str
    speaker: str
    sermon_date: str
    series: str | None = None
    primary_reference: str | None = None
    local_file: str | None = None
    summary_hint: str | None = None


@dataclass
class AudioMetadata:
    file_name: str
    mime_type: str
    size_bytes: int
    sha256: str
    duration_seconds: int | None = None

    def to_json_dict(self) -> dict[str, Any]:
        return {
            "fileName": self.file_name,
            "mimeType": self.mime_type,
            "sizeBytes": self.size_bytes,
            "sha256": self.sha256,
            "durationSeconds": self.duration_seconds,
        }

    @classmethod
    def from_json_dict(cls, data: dict[str, Any]) -> AudioMetadata:
        return cls(
            file_name=str(data["fileName"]),
            mime_type=str(data["mimeType"]),
            size_bytes=int(data["sizeBytes"]),
            sha256=str(data["sha256"]),
            duration_seconds=(
                int(data["durationSeconds"])
                if data.get("durationSeconds") is not None
                else None
            ),
        )


@dataclass
class TranscriptPayload:
    text: str
    source: str
    language: str | None = None

    def to_backend_dict(self) -> dict[str, Any]:
        return {
            "text": self.text,
            "source": self.source,
            "updatedAt": None,
        }


@dataclass
class OutlineItem:
    title: str
    summary: str
    start_seconds: int = 0

    def to_backend_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "summary": self.summary,
            "startSeconds": self.start_seconds,
        }


@dataclass
class ScriptureReference:
    reference: str
    verse_id: str
    note: str = ""
    start_seconds: int | None = None

    def to_backend_dict(self) -> dict[str, Any]:
        return {
            "reference": self.reference,
            "verseId": self.verse_id,
            "note": self.note,
            **(
                {"startSeconds": self.start_seconds}
                if self.start_seconds is not None
                else {}
            ),
        }


@dataclass
class SummaryBundle:
    summary: str
    outline: list[OutlineItem] = field(default_factory=list)
    references: list[ScriptureReference] = field(default_factory=list)
    review_markdown: str = ""
    provider: str = ""
    model: str = ""
    prompt_version: str = "v1"


@dataclass
class ProcessingMetadata:
    pipeline: str = "local-sermon-studio"
    transcription_provider: str = ""
    summary_provider: str = ""
    summary_model: str = ""
    language: str | None = None
    local_tool_version: str = "0.1.0"
    source_file: str | None = None

    def to_backend_dict(self) -> dict[str, Any]:
        return {
            "pipeline": self.pipeline,
            "transcriptionProvider": self.transcription_provider,
            "summaryProvider": self.summary_provider,
            "summaryModel": self.summary_model,
            "language": self.language,
            "localToolVersion": self.local_tool_version,
            "sourceFile": self.source_file,
        }


@dataclass
class ProjectFiles:
    root: Path
    source_dir: Path
    output_dir: Path
    logs_dir: Path
    original_audio: Path | None = None
    normalized_audio: Path | None = None
    transcript_file: Path | None = None
    markdown_file: Path | None = None
    manifest_file: Path | None = None


@dataclass
class SermonManifest:
    title: str
    speaker: str
    sermon_date: str
    series: str | None
    primary_reference: str | None
    summary: str
    duration_seconds: int | None
    audio: AudioMetadata
    transcript: TranscriptPayload
    outline: list[OutlineItem]
    references: list[ScriptureReference]
    review_markdown_file: str
    transcript_file: str
    processing_metadata: ProcessingMetadata
    backend: dict[str, Any] = field(default_factory=dict)

    def to_json_dict(self) -> dict[str, Any]:
        data = {
            "title": self.title,
            "speaker": self.speaker,
            "sermonDate": self.sermon_date,
            "series": self.series,
            "primaryReference": self.primary_reference,
            "summary": self.summary,
            "durationSeconds": self.duration_seconds,
            "audio": self.audio.to_json_dict(),
            "transcript": {
                "textFile": self.transcript_file,
                "source": self.transcript.source,
                "language": self.transcript.language,
            },
            "outline": [
                {
                    "title": item.title,
                    "summary": item.summary,
                    "startSeconds": item.start_seconds,
                }
                for item in self.outline
            ],
            "references": [
                {
                    "reference": ref.reference,
                    "verseId": ref.verse_id,
                    "note": ref.note,
                    **(
                        {"startSeconds": ref.start_seconds}
                        if ref.start_seconds is not None
                        else {}
                    ),
                }
                for ref in self.references
            ],
            "reviewMarkdownFile": self.review_markdown_file,
            "processingMetadata": self.processing_metadata.to_backend_dict(),
        }
        if self.backend:
            data["backend"] = self.backend
        return data

    def to_backend_package(
        self,
        transcript_text: str,
        review_markdown: str,
    ) -> dict[str, Any]:
        data = {
            "summary": self.summary,
            "transcript": self.transcript.to_backend_dict()
            | {"text": transcript_text},
            "outline": [item.to_backend_dict() for item in self.outline],
            "references": [ref.to_backend_dict() for ref in self.references],
            "reviewMarkdown": review_markdown,
            "processingMetadata": self.processing_metadata.to_backend_dict(),
            "submitForReview": True,
        }
        if self.duration_seconds is not None:
            data["durationSeconds"] = self.duration_seconds
        return data
