import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/l10n/app_localizations_es.dart';

void main() {
  test('Spanish giving and event labels preserve dynamic values', () {
    final l10n = AppLocalizationsEs();

    expect(l10n.eventRegistrationUnlimitedSpots(12), contains('12'));
    expect(l10n.mineLifeCoursesCountLabel(2), contains('2'));
    expect(l10n.mineLifeServingCountLabel(2), contains('2'));
    expect(
      l10n.mineLifeOverviewMetricSemanticLabel('grupos', 2),
      contains('2'),
    );
    expect(l10n.unreadCountSemanticLabel('Vida', 2), contains('2'));
    expect(l10n.bibleChapterButtonSemanticLabel('Romanos', 8), contains('8'));
    expect(l10n.relatedSermonsLabel(2), contains('2'));
    expect(l10n.givingSummaryYear(2026), contains('2026'));
    expect(l10n.givingSummaryAmount('USD 37.63'), contains('USD 37.63'));
    expect(l10n.givingSummaryCount(8), contains('8'));
    expect(l10n.givingStatementLabel(2026), contains('2026'));
    expect(
      l10n.annualStatementPdfSavedMessage('/tmp/statement.pdf'),
      contains('/tmp/statement.pdf'),
    );
  });
}
