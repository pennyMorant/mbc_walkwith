from __future__ import annotations

import json
from pathlib import Path
from typing import Callable

from .audio import build_audio_metadata, normalize_audio
from .config import AppConfig
from .downloader import copy_local_audio
from .markdown_writer import build_review_markdown
from .models import ProcessingMetadata, ProjectFiles, SermonManifest, SourceInput
from .project_store import (
    create_project_files,
    resolve_original_audio_path,
    update_manifest_backend,
    write_manifest,
    write_text,
)
from .summarizer import summarize_transcript
from .transcriber import transcribe_audio
from .uploader import BackendUploader

LogFn = Callable[[str], None]


def process_source(
    config: AppConfig,
    source: SourceInput,
    log: LogFn | None = None,
) -> ProjectFiles:
    project = create_project_files(
        config.paths.work_dir,
        source.title,
        source.sermon_date,
    )
    emit(log, f"Created working directory: {project.root}")

    original_audio = _prepare_source_audio(config, source, project, log)
    project.original_audio = original_audio
    normalized_audio = project.source_dir / "normalized.wav"
    normalize_audio(
        original_audio,
        normalized_audio,
        ffmpeg_bin=config.paths.ffmpeg_bin,
    )
    project.normalized_audio = normalized_audio
    emit(log, f"Normalized audio: {normalized_audio}")

    transcript = transcribe_audio(normalized_audio, config.transcription)
    transcript_path = write_text(project.transcript_file, transcript.text)
    project.transcript_file = transcript_path
    emit(log, f"Transcript saved: {transcript_path}")

    bundle = summarize_transcript(source, transcript.text, config.summary)
    review_markdown = bundle.review_markdown.strip() or build_review_markdown(
        source,
        transcript.text,
        bundle,
    )
    markdown_path = write_text(project.markdown_file, review_markdown)
    project.markdown_file = markdown_path
    emit(log, f"Review markdown saved: {markdown_path}")

    audio_metadata = build_audio_metadata(
        original_audio,
        ffprobe_bin=config.paths.ffprobe_bin,
    )
    processing_metadata = ProcessingMetadata(
        transcription_provider=transcript.source,
        summary_provider=bundle.provider,
        summary_model=bundle.model,
        language=transcript.language,
        source_file=Path(source.local_file).name if source.local_file else None,
    )
    manifest = SermonManifest(
        title=source.title,
        speaker=source.speaker,
        sermon_date=source.sermon_date,
        series=source.series,
        primary_reference=source.primary_reference,
        summary=bundle.summary,
        duration_seconds=audio_metadata.duration_seconds,
        audio=audio_metadata,
        transcript=transcript,
        outline=bundle.outline,
        references=bundle.references,
        review_markdown_file=markdown_path.name,
        transcript_file=transcript_path.name,
        processing_metadata=processing_metadata,
    )
    write_manifest(project, manifest)
    emit(log, f"Manifest saved: {project.manifest_file}")
    return project


def upload_project(
    config: AppConfig,
    project_root: str | Path,
    publish: bool = False,
    log: LogFn | None = None,
) -> dict[str, object]:
    project_root = Path(project_root).expanduser().resolve()
    manifest_path = project_root / "output" / "manifest.json"
    transcript_path = project_root / "output" / "transcript.txt"
    markdown_path = project_root / "output" / "review.md"

    from .models import AudioMetadata, OutlineItem, ScriptureReference, TranscriptPayload

    manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
    original_audio_path = resolve_original_audio_path(
        project_root / "source",
        manifest_data,
    )
    manifest = SermonManifest(
        title=manifest_data["title"],
        speaker=manifest_data["speaker"],
        sermon_date=manifest_data["sermonDate"],
        series=manifest_data.get("series"),
        primary_reference=manifest_data.get("primaryReference"),
        summary=manifest_data["summary"],
        duration_seconds=manifest_data.get("durationSeconds"),
        audio=AudioMetadata.from_json_dict(manifest_data["audio"]),
        transcript=TranscriptPayload(
            text=transcript_path.read_text(encoding="utf-8"),
            source=manifest_data["transcript"]["source"],
            language=manifest_data["transcript"].get("language"),
        ),
        outline=[
            OutlineItem(
                title=item["title"],
                summary=item.get("summary", ""),
                start_seconds=int(item.get("startSeconds", 0)),
            )
            for item in manifest_data.get("outline", [])
        ],
        references=[
            ScriptureReference(
                reference=item["reference"],
                verse_id=item["verseId"],
                note=item.get("note", ""),
                start_seconds=item.get("startSeconds"),
            )
            for item in manifest_data.get("references", [])
        ],
        review_markdown_file=manifest_data.get("reviewMarkdownFile", "review.md"),
        transcript_file=manifest_data["transcript"]["textFile"],
        processing_metadata=ProcessingMetadata(
            transcription_provider=(manifest_data.get("processingMetadata") or {}).get(
                "transcriptionProvider", ""
            ),
            summary_provider=(manifest_data.get("processingMetadata") or {}).get(
                "summaryProvider", ""
            ),
            summary_model=(manifest_data.get("processingMetadata") or {}).get(
                "summaryModel", ""
            ),
            language=(manifest_data.get("processingMetadata") or {}).get("language"),
            source_file=(manifest_data.get("processingMetadata") or {}).get("sourceFile"),
        ),
        backend=manifest_data.get("backend", {}),
    )

    uploader = BackendUploader(config.backend)
    try:
        sermon_id = str((manifest.backend or {}).get("sermonId") or "").strip()
        draft: dict[str, object] | None = None
        if sermon_id:
            emit(log, f"Reusing backend draft: {sermon_id}")
            canonical = uploader.get_sermon(sermon_id)
        else:
            draft = uploader.create_local_draft(manifest)
            sermon_id = str(draft["id"])
            canonical = draft
            emit(log, f"Created backend draft: {sermon_id}")
            update_manifest_backend(manifest_path, {"sermonId": sermon_id})

        uploaded_audio = uploader.upload_audio(
            sermon_id,
            int(canonical["revision"]),
            original_audio_path,
        )
        emit(log, f"Uploaded original audio for sermon {sermon_id}")

        uploaded = uploader.upload_local_package(
            sermon_id,
            int(uploaded_audio["revision"]),
            manifest,
            transcript_path.read_text(encoding="utf-8"),
            markdown_path.read_text(encoding="utf-8"),
            submit_for_review=config.backend.submit_for_review,
        )
        emit(log, f"Uploaded local package for sermon {sermon_id}")

        if publish:
            published = uploader.publish(sermon_id, int(uploaded["revision"]))
            emit(log, f"Published sermon {sermon_id}")
            update_manifest_backend(manifest_path, {"published": True})
            return {"draft": draft, "uploaded": uploaded, "published": published}

        return {"draft": draft, "uploaded": uploaded}
    finally:
        uploader.close()


def _prepare_source_audio(
    config: AppConfig,
    source: SourceInput,
    project: ProjectFiles,
    log: LogFn | None = None,
) -> Path:
    if not source.local_file:
        raise ValueError("local_file is required for local_file source type.")
    emit(log, "Copying local audio...")
    return copy_local_audio(source.local_file, project.source_dir)


def emit(log: LogFn | None, message: str) -> None:
    if log:
        log(message)
