from __future__ import annotations

import unittest

from sermon_studio.models import (
    AudioMetadata,
    OutlineItem,
    ProcessingMetadata,
    ScriptureReference,
    SermonManifest,
    TranscriptPayload,
)


class SermonManifestTest(unittest.TestCase):
    def test_manifest_audio_metadata_uses_the_reusable_json_contract(self) -> None:
        manifest = _manifest(duration_seconds=1991)

        payload = manifest.to_json_dict()
        parsed = AudioMetadata.from_json_dict(payload["audio"])

        self.assertEqual(
            payload["audio"],
            {
                "fileName": "sermon.wav",
                "mimeType": "audio/wav",
                "sizeBytes": 42,
                "sha256": "abc123",
                "durationSeconds": 1991,
            },
        )
        self.assertEqual(parsed, manifest.audio)

    def test_backend_package_includes_duration_seconds(self) -> None:
        manifest = _manifest(duration_seconds=1991)

        package = manifest.to_backend_package(
            "Reviewed transcript",
            "# Review",
        )

        self.assertEqual(package["durationSeconds"], 1991)

    def test_backend_package_omits_missing_duration_seconds(self) -> None:
        manifest = _manifest(duration_seconds=None)

        package = manifest.to_backend_package(
            "Reviewed transcript",
            "# Review",
        )

        self.assertNotIn("durationSeconds", package)


def _manifest(duration_seconds: int | None) -> SermonManifest:
    return SermonManifest(
        title="Hope in Suffering",
        speaker="Pastor David Chen",
        sermon_date="2026-05-24",
        series="Romans",
        primary_reference="Romans 8:18-30",
        summary="A concise summary.",
        duration_seconds=duration_seconds,
        audio=AudioMetadata(
            file_name="sermon.wav",
            mime_type="audio/wav",
            size_bytes=42,
            sha256="abc123",
            duration_seconds=duration_seconds,
        ),
        transcript=TranscriptPayload(
            text="Transcript body",
            source="local-whisper",
        ),
        outline=[
            OutlineItem(
                title="Present suffering",
                summary="Paul sets suffering beside future glory.",
                start_seconds=120,
            )
        ],
        references=[
            ScriptureReference(
                reference="Romans 8:28",
                verse_id="rom.8.28",
                note="Core sermon verse",
            )
        ],
        review_markdown_file="review.md",
        transcript_file="transcript.txt",
        processing_metadata=ProcessingMetadata(),
    )


if __name__ == "__main__":
    unittest.main()
