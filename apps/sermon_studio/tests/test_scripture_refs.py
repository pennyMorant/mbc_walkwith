import unittest

from sermon_studio.models import ScriptureReference
from sermon_studio.scripture_refs import sanitize_references


class ScriptureReferenceTest(unittest.TestCase):
    def test_sanitize_references_filters_invalid_and_deduplicates(self) -> None:
        refs = [
            ScriptureReference(reference="Romans 8:28", verse_id="rom.8.28"),
            ScriptureReference(reference="Romans 8:28", verse_id="rom.8.28"),
            ScriptureReference(reference="Unknown", verse_id=""),
            ScriptureReference(reference="Mark 5:22", verse_id="mak.5.22"),
            ScriptureReference(reference="Mark 5:22", verse_id="mark.5.22"),
            ScriptureReference(reference="Psalm 23:1", verse_id="psa.23.1"),
        ]

        sanitized = sanitize_references(refs)

        self.assertEqual([item.verse_id for item in sanitized], ["rom.8.28", "psa.23.1"])


if __name__ == "__main__":
    unittest.main()
