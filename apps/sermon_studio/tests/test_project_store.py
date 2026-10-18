from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from sermon_studio.project_store import create_output_files, slugify


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


if __name__ == "__main__":
    unittest.main()
