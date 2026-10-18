from __future__ import annotations

import unittest

from sermon_studio.cli import _build_parser


class CliTest(unittest.TestCase):
    def test_process_parses_start_and_end_positions(self) -> None:
        args = _build_parser().parse_args(
            [
                "process",
                "--config",
                "config.yaml",
                "--source-file",
                "sermon.mp4",
                "--start",
                "12:30",
                "--end",
                "42:00",
            ]
        )

        self.assertEqual(args.start, 750)
        self.assertEqual(args.end, 2520)

    def test_process_defaults_to_full_media(self) -> None:
        args = _build_parser().parse_args(
            [
                "process",
                "--config",
                "config.yaml",
                "--source-file",
                "sermon.mp4",
            ]
        )

        self.assertEqual(args.start, 0)
        self.assertIsNone(args.end)


if __name__ == "__main__":
    unittest.main()
