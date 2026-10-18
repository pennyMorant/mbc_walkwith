from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sermon_studio.audio import extract_audio, probe_media
from sermon_studio.config import AudioConfig
from sermon_studio.models import MediaProbe, MediaRange


class AudioTest(unittest.TestCase):
    def test_probe_media_selects_the_audio_stream(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "sermon.mp4"
            source.write_bytes(b"video")
            payload = {
                "format": {"duration": "1800.5", "format_name": "mov,mp4"},
                "streams": [
                    {"index": 0, "codec_type": "video"},
                    {
                        "index": 1,
                        "codec_type": "audio",
                        "codec_name": "aac",
                        "channels": 2,
                        "sample_rate": "48000",
                    },
                ],
            }
            result = subprocess.CompletedProcess(
                args=[], returncode=0, stdout=json.dumps(payload), stderr=""
            )

            with patch("sermon_studio.audio.subprocess.run", return_value=result):
                media = probe_media(source, "ffprobe")

            self.assertEqual(media.audio_stream_index, 1)
            self.assertEqual(media.duration_seconds, 1800.5)
            self.assertEqual(media.sample_rate, 48000)

    def test_probe_media_rejects_media_without_audio(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "silent.mp4"
            source.write_bytes(b"video")
            payload = {
                "format": {"duration": "10"},
                "streams": [{"index": 0, "codec_type": "video"}],
            }
            result = subprocess.CompletedProcess(
                args=[], returncode=0, stdout=json.dumps(payload), stderr=""
            )

            with patch("sermon_studio.audio.subprocess.run", return_value=result):
                with self.assertRaisesRegex(RuntimeError, "audio track"):
                    probe_media(source, "ffprobe")

    def test_probe_media_times_out(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "blocked.mp4"
            source.write_bytes(b"video")
            timeout = subprocess.TimeoutExpired(cmd=["ffprobe"], timeout=30)

            with patch("sermon_studio.audio.subprocess.run", side_effect=timeout):
                with self.assertRaisesRegex(RuntimeError, "timed out"):
                    probe_media(source, "ffprobe")

    def test_extract_audio_uses_selected_stream(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "sermon.mp4"
            output = Path(directory) / "sermon_audio.m4a"
            source.write_bytes(b"video")
            media = MediaProbe(60, 2, "aac", 2, 48000, "mov,mp4")

            def fake_run(command: list[str], **_: object) -> None:
                Path(command[-1]).write_bytes(b"audio")

            with patch("sermon_studio.audio.subprocess.run", side_effect=fake_run) as run:
                result = extract_audio(
                    source,
                    output,
                    media,
                    "ffmpeg",
                    AudioConfig(),
                    MediaRange(90, 150),
                )

            command = run.call_args.args[0]
            self.assertEqual(result, output.resolve())
            self.assertIn("-vn", command)
            self.assertEqual(command[command.index("-map") + 1], "0:2")
            self.assertEqual(command[command.index("-c:a") + 1], "aac")
            self.assertEqual(command[command.index("-ss") + 1], "90")
            self.assertEqual(command[command.index("-t") + 1], "60")
            self.assertLess(command.index("-ss"), command.index("-i"))
            self.assertEqual(output.read_bytes(), b"audio")
            self.assertFalse((Path(directory) / ".sermon_audio.partial.m4a").exists())

    def test_extract_audio_does_not_replace_source_media(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "sermon_audio.m4a"
            source.write_bytes(b"original")
            media = MediaProbe(60, 0, "aac", 2, 48000, "mov,mp4")

            with self.assertRaisesRegex(ValueError, "must not replace"):
                extract_audio(
                    source,
                    source,
                    media,
                    "ffmpeg",
                    AudioConfig(),
                    MediaRange(0, 60),
                )

            self.assertEqual(source.read_bytes(), b"original")


if __name__ == "__main__":
    unittest.main()
