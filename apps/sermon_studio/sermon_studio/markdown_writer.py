from __future__ import annotations

from .models import OutlineItem, ScriptureReference, SourceInput, SummaryBundle


def build_review_markdown(
    source: SourceInput,
    transcript_text: str,
    bundle: SummaryBundle,
) -> str:
    parts: list[str] = [f"# {source.title}", ""]

    parts.append(f"**Speaker:** {source.speaker}")
    parts.append(f"**Date:** {source.sermon_date}")
    if source.series:
        parts.append(f"**Series:** {source.series}")
    if source.primary_reference:
        parts.append(f"**Primary Reference:** {source.primary_reference}")
    parts.extend(["", "## Summary", bundle.summary.strip(), ""])

    if bundle.outline:
        parts.append("## Outline")
        for index, item in enumerate(bundle.outline, start=1):
            parts.extend(_outline_block(index, item))
        parts.append("")

    if bundle.references:
        parts.append("## Scripture References")
        for reference in bundle.references:
            parts.append(_reference_line(reference))
        parts.append("")

    parts.append("## Transcript")
    parts.append(transcript_text.strip())
    parts.append("")
    return "\n".join(parts).strip() + "\n"


def _outline_block(index: int, item: OutlineItem) -> list[str]:
    title = f"### {index}. {item.title}"
    details = [title]
    if item.start_seconds > 0:
        details.append(f"*Start:* {item.start_seconds}s")
    details.extend(["", item.summary.strip(), ""])
    return details


def _reference_line(reference: ScriptureReference) -> str:
    if reference.note:
        return f"- {reference.reference} ({reference.verse_id}) — {reference.note}"
    return f"- {reference.reference} ({reference.verse_id})"
