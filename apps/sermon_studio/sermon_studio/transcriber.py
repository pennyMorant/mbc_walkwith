from __future__ import annotations

from pathlib import Path

from .config import TranscriptionConfig
from .models import TranscriptPayload, TranscriptSegment


def transcribe_audio(
    normalized_audio_path: str | Path,
    config: TranscriptionConfig,
) -> TranscriptPayload:
    provider = config.provider.strip().lower()
    if provider not in {"faster-whisper", "faster-whisper-cpu", "faster-whisper-gpu"}:
        raise ValueError(f"Unsupported transcription provider: {config.provider}")
    return _transcribe_with_faster_whisper(normalized_audio_path, config)


def _transcribe_with_faster_whisper(
    normalized_audio_path: str | Path,
    config: TranscriptionConfig,
) -> TranscriptPayload:
    try:
        from faster_whisper import WhisperModel
    except ModuleNotFoundError as error:
        raise RuntimeError(
            "faster-whisper is not installed. Install with 'pip install -e .[local]'."
        ) from error

    normalized_audio_path = Path(normalized_audio_path).expanduser().resolve()
    model = WhisperModel(
        config.model,
        device=_normalized_device(config.provider, config.device),
        compute_type=config.compute_type,
    )
    raw_segments, info = model.transcribe(
        str(normalized_audio_path),
        language=config.language or None,
    )
    segments = [
        TranscriptSegment(
            start_seconds=max(0.0, float(segment.start)),
            end_seconds=max(0.0, float(segment.end)),
            text=segment.text.strip(),
        )
        for segment in raw_segments
        if segment.text.strip()
    ]
    text = "\n".join(segment.text for segment in segments).strip()
    if not text:
        raise RuntimeError("Transcription completed but returned empty text.")
    detected_language = getattr(info, "language", None) or config.language
    return TranscriptPayload(
        text=text,
        source=f"faster_whisper:{config.model}",
        language=detected_language,
        segments=segments,
    )


def _normalized_device(provider: str, configured_device: str) -> str:
    provider = provider.lower()
    if provider == "faster-whisper-cpu":
        return "cpu"
    if provider == "faster-whisper-gpu":
        return configured_device
    return configured_device
