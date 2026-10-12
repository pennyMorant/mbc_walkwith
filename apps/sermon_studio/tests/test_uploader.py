import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock

import httpx

from sermon_studio.config import BackendConfig
from sermon_studio.models import (
    AudioMetadata,
    ProcessingMetadata,
    SermonManifest,
    TranscriptPayload,
)
from sermon_studio.uploader import BackendUploader


class BackendUploaderTest(unittest.TestCase):
    def setUp(self) -> None:
        self.uploader = BackendUploader(
            BackendConfig(
                base_url="http://localhost:3020/v1",
                email="admin@example.com",
                password="password",
            )
        )
        self.uploader._client.close()
        self.client = MagicMock()
        self.uploader._client = self.client
        self.uploader._access_token = "access-token"

    def tearDown(self) -> None:
        self.uploader.close()

    def test_reads_canonical_sermon_before_reusing_a_draft(self) -> None:
        self.client.get.return_value = response("GET", {"id": "sermon-1", "revision": 4})

        sermon = self.uploader.get_sermon("sermon-1")

        self.assertEqual(sermon["revision"], 4)
        self.client.get.assert_called_once_with(
            "/admin/sermons/sermon-1",
            headers={"authorization": "Bearer access-token"},
        )

    def test_sends_each_canonical_revision_through_the_upload_chain(self) -> None:
        self.client.post.side_effect = [
            response("POST", {"id": "sermon-1", "revision": 1}),
            response("POST", {"id": "sermon-1", "revision": 2}),
            response("POST", {"id": "sermon-1", "revision": 3}),
        ]
        with tempfile.TemporaryDirectory() as tmp:
            audio_path = Path(tmp) / "sermon.mp3"
            audio_path.write_bytes(b"audio")
            audio = self.uploader.upload_audio("sermon-1", 0, audio_path)
        package = self.uploader.upload_local_package(
            "sermon-1",
            audio["revision"],
            manifest(),
            "Reviewed transcript.",
            "# Review",
        )
        published = self.uploader.publish("sermon-1", package["revision"])

        self.assertEqual(published["revision"], 3)
        calls = self.client.post.call_args_list
        self.assertEqual(calls[0].kwargs["headers"]["x-sermon-revision"], "0")
        self.assertEqual(calls[1].kwargs["headers"]["x-sermon-revision"], "1")
        self.assertEqual(calls[2].kwargs["headers"]["x-sermon-revision"], "2")

    def test_rejects_invalid_revisions_before_network_io(self) -> None:
        with self.assertRaisesRegex(ValueError, "non-negative integer"):
            self.uploader.publish("sermon-1", -1)
        self.client.post.assert_not_called()


def response(method: str, data: dict[str, object]) -> httpx.Response:
    return httpx.Response(
        200,
        json={"data": data},
        request=httpx.Request(method, "http://localhost:3020/v1/test"),
    )


def manifest() -> SermonManifest:
    return SermonManifest(
        title="Hope",
        speaker="Pastor",
        sermon_date="2026-07-12",
        series=None,
        primary_reference="Romans 8:28",
        summary="Reviewed summary.",
        duration_seconds=1800,
        audio=AudioMetadata(
            file_name="sermon.mp3",
            mime_type="audio/mpeg",
            size_bytes=5,
            sha256="hash",
        ),
        transcript=TranscriptPayload(text="", source="local-whisper"),
        outline=[],
        references=[],
        review_markdown_file="review.md",
        transcript_file="transcript.txt",
        processing_metadata=ProcessingMetadata(),
    )


if __name__ == "__main__":
    unittest.main()
