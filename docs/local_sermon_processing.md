# Local Sermon Processing Workflow

Status: active
Audience: sermon operators, Admin Web, backend maintainers

## Goal

Historical sermons may exist only as video. The workstation prepares assets for
manual review and upload:

```text
church-owned video or audio
-> inspect media and select its audio stream
-> validate the optional source start/end range
-> export standard M4A audio
-> create a temporary Whisper WAV
-> transcribe locally
-> export TXT, Markdown, SRT, and processing metadata
-> operator reviews and uploads through Admin Web
```

The workstation does not connect to the backend and is not a publishing client.

## Ownership

Sermon Studio verifies the source, extracts AAC audio into an M4A container,
transcribes with faster-whisper, exports review files, records checksums, and
removes temporary transcription audio.

The operator may process the complete source or select start/end positions to
remove pre-service and post-service material. The selected range is the single
input for both extraction and transcription. Output audio and SRT timestamps
start at zero; processing metadata retains the source positions.

The church operator confirms publication rights, corrects the transcript,
enters title/speaker/date/series/references in Admin Web, uploads audio and
reviewed text, and completes the normal review and publish flow.

Admin Web and the backend own authentication, authorization, canonical sermon
content, draft state, audit, storage, and publication.

## Local Output Contract

```text
sermon_audio.m4a
transcript.txt
transcript.md
transcript.srt
processing_info.json
```

`processing_info.json` contains source and output checksums, duration, selected
audio stream information, encoding settings, detected language, model source,
segment count, and selected source start/end positions. It contains no
credential, member data, or publish token.

## Failure Rules

- Missing sources fail before FFmpeg starts.
- Media without an audio stream fails with a clear local error.
- Start must be inside the media; end must be after start and no later than the
  media end. A sub-second duration rounding difference is clamped.
- FFmpeg writes to a temporary file and only replaces a final output after a
  non-empty result is confirmed.
- Failed extraction removes its partial output.
- The temporary Whisper WAV is removed after success or transcription failure.
- A failed run never uploads, publishes, or mutates backend data.

## Manual Admin Flow

```text
operator opens sermon editor
-> creates or edits a draft
-> uploads sermon_audio.m4a
-> pastes or imports reviewed transcript text
-> completes metadata, notes, outline, and Scripture references
-> reviews the App-facing result
-> publishes
```

Backend local-package APIs may remain for other controlled tooling, but Sermon
Studio does not call them and must not store backend credentials.

## Privacy And Copyright

- Process only church-owned or properly licensed recordings.
- Keep source media and generated files on church-controlled storage.
- Human-review names, theological terms, and Scripture references.
- Do not process private counseling, prayer, or confidential recordings here.
