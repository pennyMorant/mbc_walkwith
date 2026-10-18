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

sermon-studio process \
  --config config.yaml \
  --source-file "/path/to/sunday-service.mp4" \
  --start "12:30" \
  --end "42:00"

sermon-studio gui --config config.yaml
```

`--start` and `--end` accept seconds, `MM:SS`, or `HH:MM:SS`. Start defaults
to `00:00:00`; an omitted end processes through the end of the source. The GUI
provides equivalent start/end controls and a `Use Media End` action. Its output
field selects a parent directory; each recording receives a source-specific
child directory so one sermon cannot overwrite another.

The Linux desktop workbench also provides media preview, timeline seeking,
start/end capture from the current playback position, model and language
selection, real processing progress, cancellation, transcript review, and a
recent-recordings list. User preferences are stored under
`$XDG_CONFIG_HOME/mbc-sermon-studio` (or `~/.config/mbc-sermon-studio`).

## Linux Bundle

Build the portable x86_64 bundle on a Linux x86_64 host:

```sh
./tools/build_linux.sh
```

The result is `dist/sermon-studio/`. FFmpeg and FFprobe remain system
dependencies. Whisper models are downloaded by faster-whisper on first use and
are not embedded in the application bundle.

## Outputs

```text
sermon_audio.m4a       audio for manual Admin Web upload
transcript.txt         plain transcript
transcript.md          review-friendly transcript
transcript.srt         timestamped subtitles
processing_info.json   source, audio, checksum, and transcription metadata
```

The temporary Whisper WAV is removed after transcription. The source video is
never copied into the output directory. For a selected range, the M4A and SRT
start at `00:00:00`; `processing_info.json` records the original source start
and end positions.

## Manual Publishing Boundary

Church staff review and correct the transcript, open the sermon editor in Admin
Web, enter the sermon metadata, upload `sermon_audio.m4a` and the reviewed text,
then use the normal review and publish flow.

See [Local Sermon Processing](../../docs/local_sermon_processing.md) and the
[Fedora workstation guide](docs/fedora44_workstation.md).
