import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/platform/external_link_service.dart';
import 'package:mbc_walkwith/features/life/data/giving_repository.dart';
import 'package:mbc_walkwith/features/life/domain/giving_record.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/giving_checkout_card.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('checkout uses backend-provided giving fund allocation', (
    tester,
  ) async {
    final repository = _FakeGivingRepository();
    final linkService = _FakeExternalLinkService();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          givingRepositoryProvider.overrideWithValue(repository),
          externalLinkServiceProvider.overrideWithValue(linkService),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const Scaffold(
            body: SingleChildScrollView(
              child: GivingCheckoutCard(session: _memberSession),
            ),
          ),
        ),
      ),
    );

    await tester.pump();
    await tester.pump();

    expect(find.text('Benevolence'), findsOneWidget);

    await tester.tap(find.text('Continue to Stripe'));
    await tester.pumpAndSettle();

    expect(repository.lastCategory, 'benevolence');
    expect(repository.lastFundId, 'fund-benevolence');
    expect(repository.lastAmountCents, 5000);
    expect(linkService.openedUrl, 'https://checkout.stripe.test/benevolence');
  });

  testWidgets('checkout rejects amounts that require silent rounding', (
    tester,
  ) async {
    final repository = _FakeGivingRepository();
    final linkService = _FakeExternalLinkService();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          givingRepositoryProvider.overrideWithValue(repository),
          externalLinkServiceProvider.overrideWithValue(linkService),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const Scaffold(
            body: SingleChildScrollView(
              child: GivingCheckoutCard(session: _memberSession),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '12.345');
    await tester.tap(find.text('Continue to Stripe'));
    await tester.pump();

    expect(
      find.text(
        'Enter an amount from USD 1.00 to USD 100,000.00 with no more than two decimal places.',
      ),
      findsOneWidget,
    );
    expect(repository.lastAmountCents, isNull);
    expect(linkService.openedUrl, isNull);
  });
}

class _FakeGivingRepository implements GivingRepository {
  int? lastAmountCents;
  String? lastCategory;
  String? lastFundId;

  @override
  Future<List<GivingFund>> fetchActiveFunds(MemberSession session) async {
    return const [
      GivingFund(
        id: 'fund-benevolence',
        code: 'benevolence',
        name: 'Benevolence',
        description: 'Care fund.',
        status: 'active',
        targetAmountCents: null,
        displayOrder: 1,
      ),
    ];
  }

  @override
  Future<GivingCheckoutSession> createCheckoutSession({
    required MemberSession session,
    required int amountCents,
    required String category,
    String? fundId,
  }) async {
    lastAmountCents = amountCents;
    lastCategory = category;
    lastFundId = fundId;
    return const GivingCheckoutSession(
      checkoutSessionId: 'cs_test_benevolence',
      checkoutUrl: 'https://checkout.stripe.test/benevolence',
      transactionId: 'giving-pending-benevolence',
    );
  }

  @override
  Future<GivingOverview> fetchMemberOverview(MemberSession session) async {
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
  Future<GivingStatementExport> fetchStatementExport({
    required MemberSession session,
    required int year,
  }) async {
    return GivingStatementExport(
      filename: 'giving-statement-$year.csv',
      contentType: 'text/csv',
      csv: '',
    );
  }
}

class _FakeExternalLinkService extends ExternalLinkService {
  String? openedUrl;

  @override
  Future<bool> openExternalUrl(String? url) async {
    openedUrl = url;
    return true;
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
