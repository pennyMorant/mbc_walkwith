from __future__ import annotations

import math

from .models import MediaRange


def resolve_media_range(
    media_duration_seconds: float,
    start_seconds: float = 0,
    end_seconds: float | None = None,
) -> MediaRange:
    duration = _finite_number(media_duration_seconds, "Media duration")
    start = _finite_number(start_seconds, "Start time")
    end = duration if end_seconds is None else _finite_number(end_seconds, "End time")

    if duration <= 0:
        raise ValueError("Media duration must be greater than zero.")
    if start < 0:
        raise ValueError("Start time must not be negative.")
    if start >= duration:
        raise ValueError("Start time must be before the end of the media.")
    if end <= start:
        raise ValueError("End time must be after start time.")
    if end > duration + 1:
        raise ValueError("End time must not exceed the media duration.")
    return MediaRange(start_seconds=start, end_seconds=min(end, duration))


def parse_time_position(value: str) -> float:
    text = value.strip()
    if not text:
        raise ValueError("Time position must not be empty.")
    parts = text.split(":")
    if len(parts) > 3:
        raise ValueError("Use seconds, MM:SS, or HH:MM:SS.")
    try:
        numbers = [float(part) for part in parts]
    except ValueError as error:
        raise ValueError("Use seconds, MM:SS, or HH:MM:SS.") from error
    if any(not math.isfinite(number) or number < 0 for number in numbers):
        raise ValueError("Time values must be finite and non-negative.")
    if len(numbers) > 1 and any(number >= 60 for number in numbers[1:]):
        raise ValueError("Minutes and seconds must be less than 60.")
    seconds = 0.0
    for number in numbers:
        seconds = seconds * 60 + number
    return seconds


def format_time_position(seconds: float) -> str:
    total_seconds = max(0, round(seconds))
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02}"


def _finite_number(value: float, name: str) -> float:
    parsed = float(value)
    if not math.isfinite(parsed):
        raise ValueError(f"{name} must be finite.")
    return parsed
