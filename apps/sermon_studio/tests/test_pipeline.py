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
from sermon_studio.processing_control import CancellationToken, ProcessingCancelled
from sermon_studio.project_store import create_output_files


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
            stages: list[str] = []

            def write_audio(
                _source: Path,
                destination: Path,
                *_args: object,
                **_kwargs: object,
            ) -> Path:
                destination.write_bytes(b"audio")
                return destination

            def write_wav(
                _source: Path,
                destination: Path,
                *_args: object,
                **_kwargs: object,
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
                    stage=stages.append,
                )

            self.assertEqual(result.outputs.audio_file.read_bytes(), b"audio")
            self.assertEqual(result.media_range.start_seconds, 60)
            self.assertEqual(result.media_range.end_seconds, 120)
            self.assertTrue(result.outputs.transcript_text_file.is_file())
            self.assertFalse(result.outputs.transcription_audio_file.exists())
            self.assertFalse((output / source.name).exists())
            self.assertEqual(
                stages,
                [
                    "inspecting",
                    "extracting",
                    "preparing_audio",
                    "transcribing",
                    "writing_outputs",
                    "completed",
                ],
            )

    def test_transcription_failure_preserves_previous_outputs(self) -> None:
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
            existing = create_output_files(root, source, output)
            published_files = (
                existing.audio_file,
                existing.transcript_text_file,
                existing.transcript_markdown_file,
                existing.transcript_srt_file,
                existing.processing_info_file,
            )
            for path in published_files:
                path.write_text(f"old:{path.name}", encoding="utf-8")
            media = MediaProbe(1800, 1, "aac", 2, 48000, "mov,mp4")

            def write_audio(
                _source: Path,
                destination: Path,
                *_args: object,
                **_kwargs: object,
            ) -> Path:
                destination.write_bytes(b"new audio")
                return destination

            def write_wav(
                _source: Path,
                destination: Path,
                *_args: object,
                **_kwargs: object,
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
                    side_effect=RuntimeError("transcription failed"),
                ),
            ):
                with self.assertRaisesRegex(RuntimeError, "transcription failed"):
                    process_media(config, source, output, 60, 120)

            for path in published_files:
                self.assertEqual(
                    path.read_text(encoding="utf-8"),
                    f"old:{path.name}",
                )
            self.assertEqual(list(root.glob(".sermon-studio-stage-*")), [])

    def test_pre_cancelled_processing_does_not_probe_or_write(self) -> None:
        token = CancellationToken()
        token.cancel()

        with patch("sermon_studio.pipeline.probe_media") as probe:
            with self.assertRaises(ProcessingCancelled):
                process_media(
                    AppConfig(
                        paths=PathsConfig(work_dir="."),
                        audio=AudioConfig(),
                        transcription=TranscriptionConfig(
                            provider="faster-whisper",
                            model="small",
                        ),
                    ),
                    "missing.mp4",
                    cancellation=token,
                )

        probe.assert_not_called()


if __name__ == "__main__":
    unittest.main()
