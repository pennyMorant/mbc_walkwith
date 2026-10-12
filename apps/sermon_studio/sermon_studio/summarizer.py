from __future__ import annotations

import json
import re
from typing import Any

import httpx

from .config import SummaryConfig
from .models import OutlineItem, ScriptureReference, SourceInput, SummaryBundle
from .scripture_refs import sanitize_references


def summarize_transcript(
    source: SourceInput,
    transcript_text: str,
    config: SummaryConfig,
) -> SummaryBundle:
    provider = config.provider.strip().lower()
    if provider == "ollama":
        raw = _ollama_chat(source, transcript_text, config)
    elif provider == "openai":
        raw = _openai_chat(source, transcript_text, config)
    elif provider == "gemini":
        raw = _gemini_chat(source, transcript_text, config)
    else:
        raise ValueError(f"Unsupported summary provider: {config.provider}")
    bundle = _summary_bundle_from_response(raw, provider, config.model)
    bundle.references = sanitize_references(bundle.references)
    return bundle


def _ollama_chat(
    source: SourceInput,
    transcript_text: str,
    config: SummaryConfig,
) -> dict[str, Any]:
    endpoint = (config.endpoint or "http://localhost:11434").rstrip("/")
    payload = {
        "model": config.model,
        "stream": False,
        "format": "json",
        "messages": [
            {
                "role": "system",
                "content": _system_prompt(),
            },
            {
                "role": "user",
                "content": _user_prompt(source, transcript_text),
            },
        ],
        "options": {
            "temperature": config.temperature,
        },
    }
    response = httpx.post(f"{endpoint}/api/chat", json=payload, timeout=600.0)
    response.raise_for_status()
    data = response.json()
    content = ((data.get("message") or {}).get("content") or "").strip()
    return _load_json_payload(content)


def _openai_chat(
    source: SourceInput,
    transcript_text: str,
    config: SummaryConfig,
) -> dict[str, Any]:
    if not config.api_key:
        raise RuntimeError("OpenAI api_key is missing in config.")
    payload = {
        "model": config.model,
        "temperature": config.temperature,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {"role": "user", "content": _user_prompt(source, transcript_text)},
        ],
    }
    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "authorization": f"Bearer {config.api_key}",
            "content-type": "application/json",
        },
        json=payload,
        timeout=600.0,
    )
    response.raise_for_status()
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    return _load_json_payload(content)


def _gemini_chat(
    source: SourceInput,
    transcript_text: str,
    config: SummaryConfig,
) -> dict[str, Any]:
    if not config.api_key:
        raise RuntimeError("Gemini api_key is missing in config.")
    endpoint = (
        config.endpoint
        or f"https://generativelanguage.googleapis.com/v1beta/models/{config.model}:generateContent"
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": f"{_system_prompt()}\n\n{_user_prompt(source, transcript_text)}"
                    }
                ],
            }
        ],
        "generationConfig": {
            "temperature": config.temperature,
            "responseMimeType": "application/json",
        },
    }
    response = httpx.post(
        endpoint,
        params={"key": config.api_key},
        json=payload,
        timeout=600.0,
    )
    response.raise_for_status()
    data = response.json()
    content = data["candidates"][0]["content"]["parts"][0]["text"]
    return _load_json_payload(content)


def _summary_bundle_from_response(
    data: dict[str, Any],
    provider: str,
    model: str,
) -> SummaryBundle:
    outline = [
        OutlineItem(
            title=str(item.get("title", "")).strip(),
            summary=str(item.get("summary", "")).strip(),
            start_seconds=max(0, int(item.get("startSeconds", 0) or 0)),
        )
        for item in list(data.get("outline") or [])
        if str(item.get("title", "")).strip()
    ]
    references = [
        ScriptureReference(
            reference=str(item.get("reference", "")).strip(),
            verse_id=str(item.get("verseId", "")).strip(),
            note=str(item.get("note", "")).strip(),
            start_seconds=(
                max(0, int(item.get("startSeconds", 0) or 0))
                if item.get("startSeconds") is not None
                else None
            ),
        )
        for item in list(data.get("references") or [])
        if str(item.get("reference", "")).strip()
    ]
    return SummaryBundle(
        summary=str(data.get("summary", "")).strip(),
        outline=outline,
        references=references,
        review_markdown=str(data.get("reviewMarkdown", "")).strip(),
        provider=provider,
        model=model,
    )


def _system_prompt() -> str:
    return (
        "You are a sermon editorial assistant. "
        "Return strict JSON only. "
        "The JSON must include: summary, outline, references, reviewMarkdown. "
        "outline is an array of {title, summary, startSeconds}. "
        "references is an array of {reference, verseId, note}. "
        "Use canonical verseId format such as rom.8.28 when you are confident. "
        "If uncertain, omit the reference rather than inventing a wrong verseId."
    )


def _user_prompt(source: SourceInput, transcript_text: str) -> str:
    return (
        f"Title: {source.title}\n"
        f"Speaker: {source.speaker}\n"
        f"Date: {source.sermon_date}\n"
        f"Series: {source.series or ''}\n"
        f"Primary Reference: {source.primary_reference or ''}\n\n"
        "Create a concise sermon package from this transcript.\n\n"
        f"Transcript:\n{transcript_text}"
    )


def _load_json_payload(text: str) -> dict[str, Any]:
    text = text.strip()
    if not text:
        raise RuntimeError("Summary provider returned empty content.")
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    return json.loads(text)
