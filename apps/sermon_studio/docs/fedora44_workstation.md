# Fedora 44 Workstation Setup

This guide is the recommended starting point for running `sermon_studio` on:

- Fedora 44 Workstation
- AMD Ryzen 9950X3D
- AMD Radeon RX 9070 XT

The recommended V1 profile is:

- transcription on CPU
- summarization on local Ollama
- GPU acceleration used primarily for local LLM inference when available

## 1. Why This Profile

For Fedora 44, the safest practical path is:

- `faster-whisper` on CPU
- `Ollama` on local AMD GPU if stable

This keeps sermon transcription on the strongest and most predictable execution
path while still taking advantage of the local GPU for summary generation.

## 2. System Packages

Install the command-line tools first:

```sh
sudo dnf install -y \
  python3.12 \
  python3.12-pip \
  python3.12-virtualenv \
  ffmpeg \
  git
```

## 3. Python Environment

Create and activate a dedicated environment:

```sh
cd apps/sermon_studio
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .[local,gui]
```

If you only want the CLI first:

```sh
pip install -e .[local]
```

## 4. Ollama

Install Ollama following the official Linux instructions.

After installation, verify:

```sh
ollama serve
```

In another shell:

```sh
ollama list
```

Pull your summary model:

```sh
ollama pull qwen3:14b
```

If GPU inference is unstable on your exact Fedora 44 + AMD stack, keep the same
tool flow and switch to:

- a smaller local model
- CPU-only Ollama
- or a remote summary provider

## 5. Recommended Config

Use the Fedora-specific example config:

```sh
cp config.fedora44.example.yaml config.yaml
```

Then edit backend credentials and defaults.

## 6. Diagnostics

Before processing your first sermon, run:

```sh
sermon-studio doctor --config config.yaml
```

You want these green:

- `ffmpeg`
- `ffprobe`
- `faster-whisper`
- `ollama` (if using local summary)

## 7. First End-to-End Run

Example from a church-recorded local audio file:

```sh
sermon-studio process \
  --config config.yaml \
  --audio-file "/path/to/sermon-audio.mp3" \
  --title "Hope in Suffering" \
  --speaker "Pastor David Chen" \
  --date 2026-05-25 \
  --series "Romans" \
  --primary-reference "Romans 8:18-30"
```

Then upload:

```sh
sermon-studio upload \
  --config config.yaml \
  work/2026-05-25_hope-in-suffering
```

## 8. Recommended Runtime Expectations

For your hardware, the intended first production habit is:

- one sermon job at a time
- CPU transcription
- local model summarization
- human review before upload/publish

This is intentionally conservative and stable.

## 9. If Ollama GPU Is Not Stable

Do not block the whole tool on AMD GPU readiness.

Keep:

- `transcription.provider: faster-whisper-cpu`

Then change summary provider strategy:

1. try a smaller Ollama model
2. try CPU-only local summary
3. switch to OpenAI or Gemini API

The local processing flow stays the same.

## 10. Related Docs

- [../README.md](../README.md)
- [../../../docs/local_sermon_processing.md](../../../docs/local_sermon_processing.md)
