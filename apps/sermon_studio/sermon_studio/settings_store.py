from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from pathlib import Path


@dataclass(frozen=True)
class StudioSettings:
    output_dir: str = ""
    model: str = ""
    language: str | None = None
    recent_sources: list[str] = field(default_factory=list)


class SettingsStore:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or _config_home() / "mbc-sermon-studio" / "settings.json"

    def load(self) -> StudioSettings:
        if not self.path.is_file():
            return StudioSettings()
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            return StudioSettings(
                output_dir=str(raw.get("output_dir") or ""),
                model=str(raw.get("model") or ""),
                language=raw.get("language"),
                recent_sources=[str(value) for value in raw.get("recent_sources", [])][
                    :10
                ],
            )
        except (OSError, TypeError, ValueError, json.JSONDecodeError):
            return StudioSettings()

    def save(self, settings: StudioSettings) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(
            json.dumps(asdict(settings), ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        temporary.replace(self.path)


def _config_home() -> Path:
    configured = os.environ.get("XDG_CONFIG_HOME")
    return Path(configured).expanduser() if configured else Path.home() / ".config"
