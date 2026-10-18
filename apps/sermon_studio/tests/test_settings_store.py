from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from sermon_studio.settings_store import SettingsStore, StudioSettings


class SettingsStoreTest(unittest.TestCase):
    def test_round_trips_settings(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = SettingsStore(Path(directory) / "settings.json")
            expected = StudioSettings("/output", "medium", "zh", ["/video.mp4"])

            store.save(expected)

            self.assertEqual(store.load(), expected)

    def test_invalid_file_returns_defaults(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "settings.json"
            path.write_text("not-json", encoding="utf-8")
            self.assertEqual(SettingsStore(path).load(), StudioSettings())


if __name__ == "__main__":
    unittest.main()
