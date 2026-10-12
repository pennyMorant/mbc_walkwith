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
}
