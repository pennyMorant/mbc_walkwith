from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sermon_studio.models import OutputFiles
from sermon_studio.project_store import (
    create_output_files,
    publish_output_files,
    slugify,
)


class ProjectStoreTest(unittest.TestCase):
    def test_slugify_preserves_chinese_and_normalizes_separators(self) -> None:
        self.assertEqual(slugify("主日 信息 2026"), "主日-信息-2026")

    def test_output_file_names_are_stable(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "Sunday Service.mp4"
            source.write_bytes(b"video")

            outputs = create_output_files(root / "work", source)

            self.assertEqual(outputs.root.name, "sunday-service")
            self.assertEqual(outputs.audio_file.name, "sermon_audio.m4a")
            self.assertEqual(outputs.transcript_text_file.name, "transcript.txt")
            self.assertEqual(outputs.transcript_srt_file.name, "transcript.srt")

    def test_publish_rolls_back_all_outputs_when_replacement_fails(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "service.mp4"
            source.write_bytes(b"video")
            staged = create_output_files(root, source, root / "staged")
            destination = create_output_files(root, source, root / "destination")
            staged_files = _published_files(staged)
            destination_files = _published_files(destination)
            for path in staged_files:
                path.write_text(f"new:{path.name}", encoding="utf-8")
            for path in destination_files:
                path.write_text(f"old:{path.name}", encoding="utf-8")

            original_replace = Path.replace
            failing_source = staged.transcript_markdown_file

            def replace(path: Path, target: Path) -> Path:
                if path == failing_source:
                    raise OSError("simulated replacement failure")
                return original_replace(path, target)

            with patch.object(Path, "replace", autospec=True, side_effect=replace):
                with self.assertRaisesRegex(OSError, "simulated"):
                    publish_output_files(staged, destination)

            for path in destination_files:
                self.assertEqual(
                    path.read_text(encoding="utf-8"),
                    f"old:{path.name}",
                )


def _published_files(outputs: OutputFiles) -> tuple[Path, ...]:
    return (
        outputs.audio_file,
        outputs.transcript_text_file,
        outputs.transcript_markdown_file,
        outputs.transcript_srt_file,
        outputs.processing_info_file,
    )


if __name__ == "__main__":
    unittest.main()
