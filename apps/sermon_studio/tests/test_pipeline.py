import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from sermon_studio.config import (
    AppConfig,
    BackendConfig,
    DefaultsConfig,
    PathsConfig,
    SummaryConfig,
    TranscriptionConfig,
)
from sermon_studio.models import AudioMetadata
from sermon_studio.pipeline import upload_project
from sermon_studio.project_store import resolve_original_audio_path


class PipelineTest(unittest.TestCase):
    def test_upload_project_advances_canonical_revision_between_commands(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "source"
            output = root / "output"
            source.mkdir()
            output.mkdir()
            audio_path = source / "sermon.wav"
            audio_path.write_bytes(b"audio")
            (output / "transcript.txt").write_text(
                "Reviewed transcript.", encoding="utf-8"
            )
            (output / "review.md").write_text("# Review", encoding="utf-8")
            (output / "manifest.json").write_text(
                json.dumps(
                    {
                        "title": "Hope",
                        "speaker": "Pastor",
                        "sermonDate": "2026-07-12",
                        "series": None,
                        "primaryReference": "Romans 8:28",
                        "summary": "Summary",
                        "durationSeconds": 1800,
                        "audio": AudioMetadata(
                            file_name=audio_path.name,
                            mime_type="audio/wav",
                            size_bytes=5,
                            sha256="hash",
                        ).to_json_dict(),
                        "transcript": {
                            "textFile": "transcript.txt",
                            "source": "local-whisper",
                        },
                        "outline": [],
                        "references": [],
                        "reviewMarkdownFile": "review.md",
                        "processingMetadata": {},
                        "backend": {"sermonId": "sermon-1"},
                    }
                ),
                encoding="utf-8",
            )
            uploader = MagicMock()
            uploader.get_sermon.return_value = {"id": "sermon-1", "revision": 7}
            uploader.upload_audio.return_value = {"id": "sermon-1", "revision": 8}
            uploader.upload_local_package.return_value = {
                "id": "sermon-1",
                "revision": 9,
            }
            uploader.publish.return_value = {"id": "sermon-1", "revision": 10}

            with patch(
                "sermon_studio.pipeline.BackendUploader", return_value=uploader
            ):
                result = upload_project(config(root), root, publish=True)

            uploader.get_sermon.assert_called_once_with("sermon-1")
            self.assertEqual(
                uploader.upload_audio.call_args.args[:2], ("sermon-1", 7)
            )
            self.assertEqual(
                uploader.upload_local_package.call_args.args[:2],
                ("sermon-1", 8),
            )
            uploader.publish.assert_called_once_with("sermon-1", 9)
            self.assertEqual(result["published"]["revision"], 10)

    def test_resolve_original_audio_accepts_generated_audio_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            source_dir = Path(tmp)
            expected = source_dir / "sermon-source.wav"
            expected.write_bytes(b"audio")
            metadata = AudioMetadata(
                file_name=expected.name,
                mime_type="audio/wav",
                size_bytes=5,
                sha256="hash",
            )

            resolved = resolve_original_audio_path(
                source_dir,
                {"audio": metadata.to_json_dict()},
            )

            self.assertEqual(resolved, expected.resolve())

    def test_resolve_original_audio_uses_manifest_file_name(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            source_dir = Path(tmp)
            (source_dir / "aaa-old-file.mp3").write_bytes(b"old")
            expected = source_dir / "sermon-source.wav"
            expected.write_bytes(b"audio")

            resolved = resolve_original_audio_path(
                source_dir,
                {"audio": {"fileName": "sermon-source.wav"}},
            )

            self.assertEqual(resolved, expected.resolve())


def config(root: Path) -> AppConfig:
    return AppConfig(
        backend=BackendConfig(
            base_url="http://localhost:3020/v1",
            email="admin@example.com",
            password="password",
        ),
        paths=PathsConfig(work_dir=str(root)),
        transcription=TranscriptionConfig(provider="local", model="test"),
        summary=SummaryConfig(provider="local", model="test"),
        defaults=DefaultsConfig(),
    )

if __name__ == "__main__":
    unittest.main()
