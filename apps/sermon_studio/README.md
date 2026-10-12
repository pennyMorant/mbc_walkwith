# Sermon Studio

Local sermon processing tool for:

- processing church-recorded local audio files
- normalizing audio with `ffmpeg`
- transcribing sermon audio with `faster-whisper`
- generating structured summary, outline, references, and review markdown
- uploading finished sermon packages into the MBC WalkWith backend

## Install

```sh
cd apps/sermon_studio
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[local,gui]
```

## Configure

Copy and edit:

```sh
cp config.example.yaml config.yaml
```

For your Fedora 44 workstation profile, start from:

```sh
cp config.fedora44.example.yaml config.yaml
```

## Commands

Run diagnostics:

```sh
sermon-studio doctor --config config.yaml
```

Process a local church-recorded sermon:

```sh
sermon-studio process \
  --config config.yaml \
  --audio-file "/path/to/sermon-audio.mp3" \
  --title "Hope in Suffering" \
  --speaker "Pastor David Chen" \
  --date 2026-05-24 \
  --series "Romans" \
  --primary-reference "Romans 8:18-30"
```

Upload a processed package:

```sh
sermon-studio upload \
  --config config.yaml \
  work/2026-05-24_hope-in-suffering
```

Launch the GUI shell:

```sh
sermon-studio gui --config config.yaml
```

## Backend Contract

This tool uploads to:

- `POST /v1/admin/sermons/local-drafts`
- `POST /v1/admin/sermons/:sermonId/audio`
- `POST /v1/admin/sermons/:sermonId/local-package`
- `POST /v1/admin/sermons/:sermonId/publish`

Existing-sermon writes send the latest Admin sermon `revision` in
`x-sermon-revision`. The upload pipeline advances the token from each successful
response and stops on a stale-write conflict instead of overwriting newer work.

See:

- `../../docs/local_sermon_processing.md`
- `../../docs/api.md`
- `docs/fedora44_workstation.md`

## Recommended Hardware Profile

For a Fedora 44 workstation with:

- Ryzen 9950X3D
- Radeon RX 9070 XT

the recommended V1 execution strategy is:

- transcription on CPU with `faster-whisper`
- summary on local `Ollama`
- upload reviewed sermon packages to the backend after local processing
