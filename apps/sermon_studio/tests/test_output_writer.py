from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from sermon_studio.config import (
    AppConfig,
    AudioConfig,
    PathsConfig,
    TranscriptionConfig,
)
from sermon_studio.models import MediaProbe, TranscriptPayload, TranscriptSegment
from sermon_studio.output_writer import write_outputs
from sermon_studio.project_store import create_output_files


class OutputWriterTest(unittest.TestCase):
    def test_writes_text_markdown_subtitles_and_processing_info(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "Sunday Sermon.mp4"
            source.write_bytes(b"source")
            outputs = create_output_files(root, source, root / "output")
            outputs.audio_file.write_bytes(b"audio")
            config = AppConfig(
                paths=PathsConfig(work_dir=str(root)),
                audio=AudioConfig(),
                transcription=TranscriptionConfig(
                    provider="faster-whisper", model="small"
                ),
            )
            media = MediaProbe(60, 1, "aac", 2, 48000, "mov,mp4")
            transcript = TranscriptPayload(
                text="Grace and peace.",
                source="faster-whisper:small",
                language="en",
                segments=[TranscriptSegment(0.0, 1.25, "Grace and peace.")],
            )

            write_outputs(source, media, outputs, transcript, config)

            self.assertEqual(
                outputs.transcript_text_file.read_text(encoding="utf-8"),
                "Grace and peace.\n",
            )
            self.assertIn(
                "00:00:00,000 --> 00:00:01,250",
                outputs.transcript_srt_file.read_text(encoding="utf-8"),
            )
            info = json.loads(
                outputs.processing_info_file.read_text(encoding="utf-8")
            )
            self.assertEqual(info["audio"]["fileName"], "sermon_audio.m4a")
            self.assertEqual(info["transcription"]["segmentCount"], 1)


if __name__ == "__main__":
    unittest.main()
