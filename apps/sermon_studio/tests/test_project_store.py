import tempfile
import unittest
from pathlib import Path

from sermon_studio.project_store import create_project_files, slugify


class ProjectStoreTest(unittest.TestCase):
    def test_slugify_keeps_cjk_and_ascii(self) -> None:
        self.assertEqual(slugify("Hope in Suffering"), "hope-in-suffering")
        self.assertEqual(slugify("罗马书 第8章"), "罗马书-第8章")

    def test_create_project_files_creates_expected_structure(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            project = create_project_files(tmp, "Hope in Suffering", "2026-05-24")
            self.assertTrue(project.root.exists())
            self.assertTrue(project.source_dir.exists())
            self.assertTrue(project.output_dir.exists())
            self.assertTrue(project.logs_dir.exists())
            self.assertEqual(project.root.name, "2026-05-24_hope-in-suffering")


if __name__ == "__main__":
    unittest.main()
