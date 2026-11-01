import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/shared/utils/date_period.dart';

void main() {
  test('week periods use the current Sunday through next Sunday', () {
    final period = DatePeriod.fromDate(
      mode: DatePeriodMode.week,
      date: DateTime(2026, 8, 12),
    );

    expect(period.start, DateTime(2026, 8, 9));
    expect(period.end, DateTime(2026, 8, 16));
  });

  test('point events include the range start and exclude the range end', () {
    final period = DatePeriod.fromDate(
      mode: DatePeriodMode.month,
      date: DateTime(2026, 8, 12),
    );

    expect(period.touches(period.queryFrom, null), isTrue);
    expect(period.touches(period.queryTo, null), isFalse);
  });

  test('an unbounded query keeps content without a date', () {
    expect(
      dateRangeTouches(startsAt: null, endsAt: null, from: null, to: null),
      isTrue,
    );
  });

  test('interval events use half-open overlap boundaries', () {
    final period = DatePeriod.fromDate(
      mode: DatePeriodMode.month,
      date: DateTime(2026, 8, 12),
    );

    expect(
      period.touches(
        period.queryFrom.subtract(const Duration(hours: 2)),
        period.queryFrom,
      ),
      isFalse,
    );
    expect(
      period.touches(
        period.queryFrom.subtract(const Duration(hours: 2)),
        period.queryFrom.add(const Duration(hours: 1)),
      ),
      isTrue,
    );
  });
}
