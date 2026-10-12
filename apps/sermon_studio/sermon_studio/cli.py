from __future__ import annotations

import argparse
from pathlib import Path

from .config import load_config
from .diagnostics import run_diagnostics, summarize_diagnostics
from .gui import run_gui
from .main import run_process, run_upload
from .models import SourceInput


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
        source = SourceInput(
            source_type="local_file",
            local_file=args.audio_file,
            title=args.title,
            speaker=args.speaker or config.defaults.speaker,
            sermon_date=args.date,
            series=args.series or config.defaults.series or None,
            primary_reference=args.primary_reference
            or config.defaults.primary_reference
            or None,
            summary_hint=args.summary_hint,
        )
        project = run_process(config, source, log=print)
        print(f"Created project: {project.root}")
        return 0

    if args.command == "upload":
        result = run_upload(
            config,
            args.project_root,
            publish=args.publish,
            log=print,
        )
        print(result)
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
    process.add_argument("--audio-file", required=True)
    process.add_argument("--title", required=True)
    process.add_argument("--speaker")
    process.add_argument("--date", required=True)
    process.add_argument("--series")
    process.add_argument("--primary-reference")
    process.add_argument("--summary-hint")

    upload = subparsers.add_parser("upload")
    upload.add_argument("--config", required=True)
    upload.add_argument("project_root")
    upload.add_argument("--publish", action="store_true")

    gui = subparsers.add_parser("gui")
    gui.add_argument("--config", required=True)
    return parser
