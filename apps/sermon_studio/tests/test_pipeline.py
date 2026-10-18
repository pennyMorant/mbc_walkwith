from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sermon_studio.config import (
    AppConfig,
    AudioConfig,
    PathsConfig,
    TranscriptionConfig,
)
from sermon_studio.models import MediaProbe, TranscriptPayload, TranscriptSegment
from sermon_studio.pipeline import process_media


class PipelineTest(unittest.TestCase):
    def test_process_media_extracts_audio_and_removes_temporary_wav(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "service.mp4"
            source.write_bytes(b"video")
            output = root / "result"
            config = AppConfig(
                paths=PathsConfig(work_dir=str(root)),
                audio=AudioConfig(),
                transcription=TranscriptionConfig(
                    provider="faster-whisper", model="small"
                ),
            )
            media = MediaProbe(1800, 1, "aac", 2, 48000, "mov,mp4")
            transcript = TranscriptPayload(
                text="A complete sermon transcript.",
                source="faster-whisper:small",
                language="en",
                segments=[
                    TranscriptSegment(0, 2, "A complete sermon transcript.")
                ],
            )

            def write_audio(
                _source: Path,
                destination: Path,
                *_args: object,
            ) -> Path:
                destination.write_bytes(b"audio")
                return destination

            def write_wav(
                _source: Path,
                destination: Path,
                *_args: object,
            ) -> Path:
                destination.write_bytes(b"wav")
                return destination

            with (
                patch("sermon_studio.pipeline.probe_media", return_value=media),
                patch(
                    "sermon_studio.pipeline.extract_audio",
                    side_effect=write_audio,
                ),
                patch(
                    "sermon_studio.pipeline.create_transcription_audio",
                    side_effect=write_wav,
                ),
                patch(
                    "sermon_studio.pipeline.transcribe_audio",
                    return_value=transcript,
                ),
            ):
                result = process_media(
                    config,
                    source,
                    output,
                    start_seconds=60,
                    end_seconds=120,
                )

            self.assertEqual(result.outputs.audio_file.read_bytes(), b"audio")
            self.assertEqual(result.media_range.start_seconds, 60)
            self.assertEqual(result.media_range.end_seconds, 120)
            self.assertTrue(result.outputs.transcript_text_file.is_file())
            self.assertFalse(result.outputs.transcription_audio_file.exists())
            self.assertFalse((output / source.name).exists())


if __name__ == "__main__":
    unittest.main()
