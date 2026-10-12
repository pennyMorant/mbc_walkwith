from __future__ import annotations

import shutil
from pathlib import Path


def copy_local_audio(source: str | Path, destination_dir: str | Path) -> Path:
    source = Path(source).expanduser().resolve()
    destination_dir = Path(destination_dir).expanduser().resolve()
    destination_dir.mkdir(parents=True, exist_ok=True)
    destination = destination_dir / source.name
    shutil.copy2(source, destination)
    return destination
