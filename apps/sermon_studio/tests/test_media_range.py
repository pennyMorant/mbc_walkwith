from __future__ import annotations

import unittest

from sermon_studio.media_range import parse_time_position, resolve_media_range


class MediaRangeTest(unittest.TestCase):
    def test_parses_seconds_minutes_and_hours(self) -> None:
        self.assertEqual(parse_time_position("75"), 75)
        self.assertEqual(parse_time_position("01:15"), 75)
        self.assertEqual(parse_time_position("01:02:03"), 3723)

    def test_rejects_invalid_time_components(self) -> None:
        with self.assertRaisesRegex(ValueError, "less than 60"):
            parse_time_position("01:75")

    def test_defaults_to_the_full_media_range(self) -> None:
        media_range = resolve_media_range(1800)

        self.assertEqual(media_range.start_seconds, 0)
        self.assertEqual(media_range.end_seconds, 1800)

    def test_resolves_a_partial_range(self) -> None:
        media_range = resolve_media_range(1800, 120, 600)

        self.assertEqual(media_range.duration_seconds, 480)

    def test_clamps_a_rounded_end_time(self) -> None:
        media_range = resolve_media_range(1799.6, 0, 1800)

        self.assertEqual(media_range.end_seconds, 1799.6)

    def test_rejects_end_before_start(self) -> None:
        with self.assertRaisesRegex(ValueError, "after start"):
            resolve_media_range(1800, 600, 300)

    def test_rejects_range_outside_media(self) -> None:
        with self.assertRaisesRegex(ValueError, "media duration"):
            resolve_media_range(1800, 0, 1802)


if __name__ == "__main__":
    unittest.main()
