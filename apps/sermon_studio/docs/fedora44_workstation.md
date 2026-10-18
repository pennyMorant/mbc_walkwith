# Fedora 44 Workstation Setup

This is the recommended setup for the church workstation with a Ryzen 9950X3D.
Sermon Studio runs FFmpeg extraction and faster-whisper transcription locally.
It needs no backend credentials, AI summary provider, or VPS worker.

## System Packages

```sh
sudo dnf install -y \
  python3.12 \
  python3.12-pip \
  python3.12-virtualenv \
  ffmpeg \
  git
```

## Python Environment

```sh
cd apps/sermon_studio
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .[local,gui]
cp config.fedora44.example.yaml config.yaml
```

For CLI-only use, install `.[local]` instead.

## Run

```sh
sermon-studio doctor --config config.yaml

sermon-studio process \
  --config config.yaml \
  --source-file "/path/to/sunday-service.mp4"
```

To remove pre-service or post-service video, select a source range:

```sh
sermon-studio process \
  --config config.yaml \
  --source-file "/path/to/sunday-service.mp4" \
  --start "15:20" \
  --end "48:10"
```

The first run may download the configured Whisper model. Later runs reuse its
local cache. Process one sermon at a time, review the transcript, and manually
upload the M4A audio and corrected text in Admin Web. Sermon Studio has no
upload command.

CPU transcription is the default because it is predictable and fast on the
9950X3D. Future GPU acceleration must preserve the local-only boundary.

See [Sermon Studio](../README.md) and
[Local Sermon Processing](../../../docs/local_sermon_processing.md).
