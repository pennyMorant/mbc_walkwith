import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/giving_repository.dart';
import 'package:mbc_walkwith/features/life/domain/giving_checkout_return.dart';
import 'package:mbc_walkwith/features/life/domain/giving_record.dart';
import 'package:mbc_walkwith/features/life/presentation/giving_history_page.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('handles a checkout return when the existing route updates', (
    tester,
  ) async {
    final repository = _HistoryGivingRepository();
    var handledCount = 0;

    await tester.pumpWidget(
      _historyApp(repository: repository, checkoutReturn: null),
    );
    await tester.pumpAndSettle();
    final initialFetchCount = repository.overviewFetchCount;

    await tester.pumpWidget(
      _historyApp(
        repository: repository,
        checkoutReturn: GivingCheckoutReturn.canceled,
        onHandled: () => handledCount += 1,
      ),
    );
    await tester.pump();

    expect(find.text('Stripe checkout was canceled.'), findsOneWidget);
    expect(handledCount, 1);
    expect(repository.overviewFetchCount, greaterThan(initialFetchCount));
  });

  testWidgets('finishes confirmation polling before clearing the route value', (
    tester,
  ) async {
    final repository = _HistoryGivingRepository();
    var handledCount = 0;

    await tester.pumpWidget(
      _historyApp(
        repository: repository,
        checkoutReturn: GivingCheckoutReturn.finished,
        onHandled: () => handledCount += 1,
      ),
    );
    await tester.pump();

    expect(
      find.text(
        'Stripe checkout finished. Your gift will appear after payment confirmation.',
      ),
      findsOneWidget,
    );
    expect(handledCount, 0);

    await tester.pump(const Duration(seconds: 30));
    expect(handledCount, 1);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('cancels confirmation polling when giving history is disposed', (
    tester,
  ) async {
    final repository = _HistoryGivingRepository();
    var handledCount = 0;

    await tester.pumpWidget(
      _historyApp(
        repository: repository,
        checkoutReturn: GivingCheckoutReturn.finished,
        onHandled: () => handledCount += 1,
      ),
    );
    await tester.pump();
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(seconds: 30));

    expect(handledCount, 0);
  });
}

Widget _historyApp({
  required GivingRepository repository,
  required GivingCheckoutReturn? checkoutReturn,
  VoidCallback? onHandled,
}) {
  return ProviderScope(
    overrides: [
      memberSessionProvider.overrideWith((ref) async => _memberSession),
      givingRepositoryProvider.overrideWithValue(repository),
    ],
    child: MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      home: GivingHistoryPage(
        checkoutReturn: checkoutReturn,
        onCheckoutReturnHandled: onHandled,
      ),
    ),
  );
}

class _HistoryGivingRepository implements GivingRepository {
  int overviewFetchCount = 0;

  @override
  Future<GivingOverview> fetchMemberOverview(MemberSession session) async {
    overviewFetchCount += 1;
    return const GivingOverview(
      transactions: [],
      summary: GivingSummary(
        year: 2026,
        totalAmountCents: 0,
        transactionCount: 0,
        currency: 'USD',
      ),
      statements: [],
    );
  }

  @override
  Future<List<GivingFund>> fetchActiveFunds(MemberSession session) async {
    return const [
      GivingFund(
        id: 'fund-offering',
        code: 'offering',
        name: 'General Offering',
        description: '',
        status: 'active',
        targetAmountCents: null,
        displayOrder: 0,
      ),
    ];
  }

  @override
  Future<GivingCheckoutSession> createCheckoutSession({
    required MemberSession session,
    required int amountCents,
    required String category,
    String? fundId,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<GivingStatementExport> fetchStatementExport({
    required MemberSession session,
    required int year,
  }) {
    throw UnimplementedError();
  }
}

const _memberSession = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Member',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);
