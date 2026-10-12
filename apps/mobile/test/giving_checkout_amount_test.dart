import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/giving_checkout_amount.dart';
import 'package:mbc_walkwith/features/life/domain/giving_checkout_return.dart';

void main() {
  group('giving checkout intent', () {
    test('parses exact cents for supported locale separators', () {
      expect(parseGivingAmountCents('12.34', localeTag: 'en'), 1234);
      expect(parseGivingAmountCents('12,34', localeTag: 'es'), 1234);
      expect(parseGivingAmountCents('1', localeTag: 'zh-Hans'), 100);
    });

    test('rejects rounding, grouping, and request-contract overflow', () {
      expect(parseGivingAmountCents('12.345', localeTag: 'en'), isNull);
      expect(parseGivingAmountCents('1,000', localeTag: 'en'), isNull);
      expect(parseGivingAmountCents('0.99', localeTag: 'en'), isNull);
      expect(parseGivingAmountCents('100000.01', localeTag: 'en'), isNull);
    });

    test('maps only supported one-time checkout return values', () {
      expect(
        parseGivingCheckoutReturn('success'),
        GivingCheckoutReturn.finished,
      );
      expect(
        parseGivingCheckoutReturn('cancel'),
        GivingCheckoutReturn.canceled,
      );
      expect(parseGivingCheckoutReturn('succeeded'), isNull);
      expect(parseGivingCheckoutReturn(null), isNull);
    });
  });
}
