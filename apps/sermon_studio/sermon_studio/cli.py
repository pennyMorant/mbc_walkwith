from __future__ import annotations

import argparse

from .config import load_config
from .diagnostics import run_diagnostics, summarize_diagnostics
from .gui import run_gui
from .main import run_process
from .media_range import parse_time_position


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "gui":
        return run_gui(args.config)

    config = load_config(args.config)
    if args.command == "doctor":
        results = run_diagnostics(config)
        ok, summary = summarize_diagnostics(results)
        for item in results:
            status = "OK" if item.ok else "FAIL"
            print(f"[{status}] {item.name}: {item.detail}")
        print(summary)
        return 0 if ok else 1

    if args.command == "process":
        result = run_process(
            config,
            args.source_file,
            output_dir=args.output_dir,
            start_seconds=args.start,
            end_seconds=args.end,
            log=print,
        )
        print(f"Audio: {result.outputs.audio_file}")
        print(f"Transcript: {result.outputs.transcript_text_file}")
        return 0

    parser.print_help()
    return 1


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="sermon-studio")
    subparsers = parser.add_subparsers(dest="command")

    doctor = subparsers.add_parser("doctor")
    doctor.add_argument("--config", required=True)

    process = subparsers.add_parser("process")
    process.add_argument("--config", required=True)
    process.add_argument("--source-file", required=True)
    process.add_argument("--output-dir")
    process.add_argument(
        "--start",
        type=_time_position,
        default=0,
        help="Start position in seconds, MM:SS, or HH:MM:SS (default: 0).",
    )
    process.add_argument(
        "--end",
        type=_time_position,
        help="End position in seconds, MM:SS, or HH:MM:SS (default: media end).",
    )

    gui = subparsers.add_parser("gui")
    gui.add_argument("--config", required=True)
    return parser


def _time_position(value: str) -> float:
    try:
        return parse_time_position(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from error
