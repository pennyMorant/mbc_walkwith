import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../member_auth/data/member_session_repository.dart';
import 'dto/giving_checkout_dto.dart';
import 'dto/giving_fund_dto.dart';
import 'dto/giving_record_dto.dart';
import '../domain/giving_record.dart';

final givingRepositoryProvider = Provider<GivingRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return const MockGivingRepository();
  }
  return ApiGivingRepository(apiClient: ref.watch(apiClientProvider));
});

final memberGivingOverviewProvider = FutureProvider<GivingOverview?>((
  ref,
) async {
  final session = ref
      .watch(memberSessionProvider)
      .maybeWhen(data: (session) => session, orElse: () => null);
  if (session == null) {
    return null;
  }
  return ref.watch(givingRepositoryProvider).fetchMemberOverview(session);
});

final activeGivingFundsProvider =
    FutureProvider.family<List<GivingFund>, MemberSession>((ref, session) {
      return ref.watch(givingRepositoryProvider).fetchActiveFunds(session);
    });

abstract class GivingRepository {
  Future<GivingOverview> fetchMemberOverview(MemberSession session);

  Future<List<GivingFund>> fetchActiveFunds(MemberSession session);

  Future<GivingCheckoutSession> createCheckoutSession({
    required MemberSession session,
    required int amountCents,
    required String category,
    String? fundId,
  });

  Future<GivingStatementExport> fetchStatementExport({
    required MemberSession session,
    required int year,
  });
}

class ApiGivingRepository implements GivingRepository {
  const ApiGivingRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<GivingFund>> fetchActiveFunds(MemberSession session) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/member/giving/funds',
      session.accessToken,
    );
    return readActiveGivingFunds(response);
  }

  @override
  Future<GivingOverview> fetchMemberOverview(MemberSession session) async {
    final year = DateTime.now().year;
    final responses = await Future.wait([
      apiClient.getJsonMapWithBearer(
        '/member/giving/transactions?year=$year&limit=20',
        session.accessToken,
      ),
      apiClient.getJsonMapWithBearer(
        '/member/giving/statements?limit=20',
        session.accessToken,
      ),
    ]);
    return readGivingOverview(
      transactionsResponse: responses[0],
      statementsResponse: responses[1],
    );
  }

  @override
  Future<GivingStatementExport> fetchStatementExport({
    required MemberSession session,
    required int year,
  }) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/member/giving/statements/$year/download',
      session.accessToken,
    );
    return readGivingStatementExport(response);
  }

  @override
  Future<GivingCheckoutSession> createCheckoutSession({
    required MemberSession session,
    required int amountCents,
    required String category,
    String? fundId,
  }) async {
    final response = await apiClient.postJsonMapWithBearer(
      '/member/giving/checkout-sessions',
      {
        'amountCents': amountCents,
        'currency': 'USD',
        'category': category,
        if (fundId != null && fundId.trim().isNotEmpty) 'fundId': fundId.trim(),
        'donorName': session.member.displayName,
        'donorEmail': session.member.email,
      },
      session.accessToken,
    );
    return readGivingCheckoutSession(response);
  }
}

class MockGivingRepository implements GivingRepository {
  const MockGivingRepository();

  static final List<GivingFund> _funds = [
    const GivingFund(
      id: 'fund-offering',
      code: 'offering',
      name: 'General Offering',
      description: 'General church offering.',
      status: 'active',
      targetAmountCents: null,
      displayOrder: 10,
    ),
    const GivingFund(
      id: 'fund-missions',
      code: 'missions',
      name: 'Missions',
      description: 'Missions and outreach giving.',
      status: 'active',
      targetAmountCents: null,
      displayOrder: 20,
    ),
  ];

  static final List<GivingTransaction> _transactions = [
    GivingTransaction(
      id: 'mock-giving-1',
      amountCents: 5000,
      currency: 'USD',
      category: 'offering',
      status: 'succeeded',
      givenAt: DateTime(2026, 5, 10),
    ),
  ];

  static final List<GivingStatement> _statements = [
    GivingStatement(
      id: 'mock-statement-2025',
      taxYear: 2025,
      totalAmountCents: 8000,
      currency: 'USD',
      status: 'ready',
      generatedAt: null,
    ),
  ];

  @override
  Future<List<GivingFund>> fetchActiveFunds(MemberSession session) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return _funds;
  }

  @override
  Future<GivingOverview> fetchMemberOverview(MemberSession session) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return GivingOverview(
      transactions: _transactions,
      summary: const GivingSummary(
        year: 2026,
        totalAmountCents: 5000,
        transactionCount: 1,
        currency: 'USD',
      ),
      statements: _statements,
    );
  }

  @override
  Future<GivingCheckoutSession> createCheckoutSession({
    required MemberSession session,
    required int amountCents,
    required String category,
    String? fundId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return GivingCheckoutSession(
      checkoutSessionId: 'cs_test_mock',
      checkoutUrl: 'https://checkout.stripe.test/mock',
      transactionId: 'mock-pending-giving',
    );
  }

  @override
  Future<GivingStatementExport> fetchStatementExport({
    required MemberSession session,
    required int year,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return GivingStatementExport(
      filename: 'giving-statement-$year.csv',
      contentType: 'text/csv',
      pdfBase64: null,
      csv: [
        'statementId,mock-statement-$year',
        'taxYear,$year',
        'currency,USD',
        'totalAmountCents,8000',
        '',
        'transactionId,givenAt,category,amountCents,currency,provider',
        'mock-giving-1,2026-05-10T00:00:00.000Z,offering,5000,USD,stripe',
      ].join('\n'),
    );
  }
}
