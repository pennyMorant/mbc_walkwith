# Sermon Studio

Sermon Studio is an offline workstation tool for church-owned sermon media:

```text
local video or audio
-> extract a standard M4A audio file
-> transcribe locally with faster-whisper
-> write local transcript files
-> church staff review and upload through Admin Web
```

It does not authenticate with, call, upload to, or publish through the backend.
It does not generate sermon summaries, outlines, or Scripture references.

## Install

```sh
cd apps/sermon_studio
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .[local,gui]
```

FFmpeg and FFprobe must be installed separately and available on `PATH`.

## Configure

```sh
cp config.example.yaml config.yaml
```

Use `config.fedora44.example.yaml` for the church Fedora workstation.

## Commands

```sh
sermon-studio doctor --config config.yaml

sermon-studio process \
  --config config.yaml \
  --source-file "/path/to/sunday-service.mp4"

sermon-studio process \
  --config config.yaml \
  --source-file "/path/to/sunday-service.mp4" \
  --output-dir "/path/to/sermon-output"

sermon-studio gui --config config.yaml
```

## Outputs

```text
sermon_audio.m4a       audio for manual Admin Web upload
transcript.txt         plain transcript
transcript.md          review-friendly transcript
transcript.srt         timestamped subtitles
processing_info.json   source, audio, checksum, and transcription metadata
```

The temporary Whisper WAV is removed after transcription. The source video is
never copied into the output directory.

## Manual Publishing Boundary

Church staff review and correct the transcript, open the sermon editor in Admin
Web, enter the sermon metadata, upload `sermon_audio.m4a` and the reviewed text,
then use the normal review and publish flow.

See [Local Sermon Processing](../../docs/local_sermon_processing.md) and the
[Fedora workstation guide](docs/fedora44_workstation.md).
