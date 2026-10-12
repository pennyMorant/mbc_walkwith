import unittest

from sermon_studio.markdown_writer import build_review_markdown
from sermon_studio.models import OutlineItem, ScriptureReference, SourceInput, SummaryBundle


class MarkdownWriterTest(unittest.TestCase):
    def test_build_review_markdown_includes_core_sections(self) -> None:
        source = SourceInput(
            source_type="local_file",
            local_file="/tmp/sermon.mp3",
            title="Hope in Suffering",
            speaker="Pastor David Chen",
            sermon_date="2026-05-24",
            series="Romans",
            primary_reference="Romans 8:18-30",
        )
        bundle = SummaryBundle(
            summary="A concise summary.",
            outline=[
                OutlineItem(
                    title="Present suffering",
                    summary="Paul sets suffering beside future glory.",
                    start_seconds=120,
                )
            ],
            references=[
                ScriptureReference(
                    reference="Romans 8:28",
                    verse_id="rom.8.28",
                    note="Core sermon verse",
                )
            ],
        )

        markdown = build_review_markdown(source, "Transcript body", bundle)

        self.assertIn("# Hope in Suffering", markdown)
        self.assertIn("## Summary", markdown)
        self.assertIn("## Outline", markdown)
        self.assertIn("## Scripture References", markdown)
        self.assertIn("## Transcript", markdown)


if __name__ == "__main__":
    unittest.main()
