# Local Sermon Processing Workflow

Status: draft  
Audience: sermon content operators, backend, admin web, mobile integration

This document defines the preferred workflow when sermon processing is done
locally on a high-performance workstation instead of on the backend.

## 1. Goal

The local workstation is responsible for:

- audio normalization
- speech-to-text transcription
- AI summary generation
- outline drafting
- scripture reference extraction
- human review before upload

The backend is responsible for:

- storing sermon metadata
- storing transcript, summary, outline, references
- storing review markdown
- storing or linking the original audio file in object storage
- admin review, publish, audit, and distribution

## 2. System of Record

### Audio

Original sermon audio is the source asset and should be stored in `R2` through
the backend audio upload flow.

### Structured Content

The backend database is the source of truth for structured sermon content:

- `summary`
- `transcript`
- `outline`
- `references`
- `reviewMarkdown`
- `processingMetadata`

### Markdown

Markdown is a **review/export representation**, not the only source of truth.

## 3. Recommended Local Package

Suggested local processing directory:

```text
sermon-package/
  manifest.json
  transcript.txt
  review.md
```

Suggested `manifest.json` shape:

```json
{
  "title": "Hope in Suffering",
  "speaker": "Pastor David Chen",
  "sermonDate": "2026-05-24",
  "series": "Romans",
  "primaryReference": "Romans 8:18-30",
  "summary": "This sermon explains hope in suffering through Romans 8...",
  "durationSeconds": 2380,
  "audio": {
    "fileName": "sermon.mp3",
    "mimeType": "audio/mpeg",
    "sizeBytes": 48200123,
    "sha256": "..."
  },
  "transcript": {
    "textFile": "transcript.txt",
    "source": "local_whisper:ggml-large-v3.bin",
    "language": "zh"
  },
  "outline": [
    {
      "title": "Present suffering",
      "summary": "Paul sets present suffering beside future glory.",
      "startSeconds": 120
    }
  ],
  "references": [
    {
      "reference": "Romans 8:28",
      "verseId": "rom.8.28",
      "note": "Core sermon verse"
    }
  ],
  "reviewMarkdownFile": "review.md",
  "processingMetadata": {
    "pipeline": "local-sermon-studio",
    "transcriptionProvider": "local-whisper",
    "summaryProvider": "local-ai"
  }
}
```

## 4. Backend API Flow

### Step 1: Create a Local Draft

```text
POST /v1/admin/sermons/local-drafts
```

Request:

```json
{
  "title": "Hope in Suffering",
  "speaker": "Pastor David Chen",
  "sermonDate": "2026-05-24",
  "series": "Romans",
  "primaryReference": "Romans 8:18-30",
  "summary": "Draft summary"
}
```

Response:

```json
{
  "data": {
    "id": "sermon_uuid",
    "revision": 0,
    "status": "draft"
  },
  "meta": {}
}
```

### Step 2: Upload Original Audio

Use the existing binary upload endpoint:

```text
POST /v1/admin/sermons/:sermonId/audio
x-sermon-revision: 0
```

This keeps the original audio in the configured storage backend, including R2
when `MEDIA_STORAGE_DRIVER=s3`.

### Step 3: Upload the Reviewed Local Package

```text
POST /v1/admin/sermons/:sermonId/local-package
x-sermon-revision: <revision returned by audio upload>
```

Request:

```json
{
  "summary": "Reviewed local summary",
  "transcript": {
    "text": "Reviewed transcript body.",
    "source": "local_whisper:ggml-large-v3.bin",
    "updatedAt": null
  },
  "outline": [
    {
      "title": "The shepherd leads",
      "summary": "The Lord leads with care.",
      "startSeconds": 0
    }
  ],
  "references": [
    {
      "reference": "Psalm 23:1",
      "verseId": "psa.23.1",
      "note": "Primary text"
    }
  ],
  "reviewMarkdown": "# Local Processed Sermon\n\n## Summary\nReviewed local summary",
  "processingMetadata": {
    "pipeline": "local-sermon-studio",
    "transcriptionProvider": "local-whisper",
    "summaryProvider": "local-ai"
  },
  "submitForReview": true
}
```

Behavior:

- stores transcript/summary/outline/references
- stores review markdown
- stores processing metadata
- moves the sermon to `needs_review` when `submitForReview=true`

### Step 4: Publish

After admin review:

```text
POST /v1/admin/sermons/:sermonId/publish
x-sermon-revision: <revision returned by package upload>
```

## 5. Current Contract Extensions

The sermon API now supports:

- Admin-only `revision`
- `reviewMarkdown`
- `processingMetadata`

All three fields are available in Admin sermon payloads. Public App sermon
payloads omit `revision`, `reviewMarkdown`, and `processingMetadata`.

The local Studio reads the canonical Admin sermon before reusing an existing
draft, then advances the revision from each successful mutation response. It
does not retry a stale upload automatically; `sermon_state_changed` requires an
operator refresh so reviewed work is never silently overwritten.

## 6. UI Guidance

### Admin Web

Use structured fields as the primary editable source:

- summary
- transcript
- outline
- references

Use markdown as:

- review draft
- export/copy surface
- human-friendly formatted notes

### Mobile App

Do not render markdown as the primary sermon detail layout.

Recommended mobile structure:

- summary card
- outline list
- scripture reference list
- transcript section
- optional “full notes” markdown reader page

## 7. Why This Workflow

This workflow is preferred when:

- the local workstation is stronger than the backend server
- sermon processing volume is low enough for manual review
- you want the backend to stay lightweight

Benefits:

- heavy CPU work stays local
- backend remains a distribution and publishing system
- structured sermon data still lives centrally

## 8. Practical Recommendation

For this repository, the recommended production direction is:

- do transcription and AI summarization locally
- upload original audio through the backend to R2
- upload reviewed structured content to the backend
- publish from admin after final review
