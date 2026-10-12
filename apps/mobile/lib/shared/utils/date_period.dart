enum DatePeriodMode { week, month }

class DatePeriod {
  const DatePeriod._({
    required this.mode,
    required this.anchor,
    required this.start,
    required this.end,
  });

  factory DatePeriod.current(DatePeriodMode mode, {DateTime? now}) {
    return DatePeriod.fromDate(mode: mode, date: now ?? DateTime.now());
  }

  factory DatePeriod.fromDate({
    required DatePeriodMode mode,
    required DateTime date,
  }) {
    final localDate = DateTime(date.year, date.month, date.day);
    final start = switch (mode) {
      DatePeriodMode.week => _startOfWeek(localDate),
      DatePeriodMode.month => DateTime(localDate.year, localDate.month),
    };
    final end = switch (mode) {
      DatePeriodMode.week => start.add(const Duration(days: 7)),
      DatePeriodMode.month => DateTime(start.year, start.month + 1),
    };
    return DatePeriod._(mode: mode, anchor: localDate, start: start, end: end);
  }

  final DatePeriodMode mode;
  final DateTime anchor;
  final DateTime start;
  final DateTime end;

  DatePeriod get previous {
    final previousAnchor = switch (mode) {
      DatePeriodMode.week => anchor.subtract(const Duration(days: 7)),
      DatePeriodMode.month => DateTime(anchor.year, anchor.month - 1, 1),
    };
    return DatePeriod.fromDate(mode: mode, date: previousAnchor);
  }

  DatePeriod get next {
    final nextAnchor = switch (mode) {
      DatePeriodMode.week => anchor.add(const Duration(days: 7)),
      DatePeriodMode.month => DateTime(anchor.year, anchor.month + 1, 1),
    };
    return DatePeriod.fromDate(mode: mode, date: nextAnchor);
  }

  DateTime get queryFrom => start.toUtc();
  DateTime get queryTo => end.toUtc();

  bool get isCurrent {
    final current = DatePeriod.current(mode);
    return _sameDay(start, current.start) && _sameDay(end, current.end);
  }

  bool touches(DateTime? itemStart, DateTime? itemEnd) {
    final startValue = itemStart;
    if (startValue == null) {
      return false;
    }
    final endValue = itemEnd ?? startValue;
    return endValue.isAfter(queryFrom) && startValue.isBefore(queryTo);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is DatePeriod &&
            runtimeType == other.runtimeType &&
            mode == other.mode &&
            start == other.start &&
            end == other.end;
  }

  @override
  int get hashCode => Object.hash(mode, start, end);
}

DateTime _startOfWeek(DateTime date) {
  return DateTime(
    date.year,
    date.month,
    date.day,
  ).subtract(Duration(days: date.weekday % 7));
}

bool _sameDay(DateTime a, DateTime b) {
  return a.year == b.year && a.month == b.month && a.day == b.day;
}
