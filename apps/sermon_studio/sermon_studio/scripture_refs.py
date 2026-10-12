from __future__ import annotations

import re

from .models import ScriptureReference

_VERSE_ID_PATTERN = re.compile(r"^[1-3]?[a-z]{2,}\.\d+\.\d+$")
_CANONICAL_BOOK_IDS = {
    "gen",
    "exo",
    "lev",
    "num",
    "deu",
    "jos",
    "jdg",
    "rut",
    "1sa",
    "2sa",
    "1ki",
    "2ki",
    "1ch",
    "2ch",
    "ezr",
    "neh",
    "est",
    "job",
    "psa",
    "pro",
    "ecc",
    "sng",
    "isa",
    "jer",
    "lam",
    "ezk",
    "dan",
    "hos",
    "jol",
    "amo",
    "oba",
    "jon",
    "mic",
    "nam",
    "hab",
    "zep",
    "hag",
    "zec",
    "mal",
    "mat",
    "mrk",
    "luk",
    "jhn",
    "act",
    "rom",
    "1co",
    "2co",
    "gal",
    "eph",
    "php",
    "col",
    "1th",
    "2th",
    "1ti",
    "2ti",
    "tit",
    "phm",
    "heb",
    "jas",
    "1pe",
    "2pe",
    "1jn",
    "2jn",
    "3jn",
    "jud",
    "rev",
}


def sanitize_references(
    references: list[ScriptureReference],
) -> list[ScriptureReference]:
    sanitized: list[ScriptureReference] = []
    seen: set[tuple[str, str]] = set()
    for ref in references:
        verse_id = ref.verse_id.strip().lower()
        if not verse_id or not _is_canonical_verse_id(verse_id):
            continue
        key = (ref.reference.strip(), verse_id)
        if key in seen:
            continue
        seen.add(key)
        sanitized.append(
            ScriptureReference(
                reference=ref.reference.strip(),
                verse_id=verse_id,
                note=ref.note.strip(),
                start_seconds=ref.start_seconds,
            )
        )
    return sanitized


def _is_canonical_verse_id(verse_id: str) -> bool:
    if not _VERSE_ID_PATTERN.match(verse_id):
        return False
    book_id = verse_id.split(".", 1)[0]
    return book_id in _CANONICAL_BOOK_IDS
