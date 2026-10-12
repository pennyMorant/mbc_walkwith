import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/life/data/giving_repository.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  test('fetches active giving funds with bearer auth', () async {
    final dio = _GivingDio();
    final repository = ApiGivingRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final funds = await repository.fetchActiveFunds(_memberSession);

    expect(funds.map((fund) => fund.id), ['fund-offering', 'fund-missions']);
    expect(funds.first.code, 'offering');
    expect(dio.requests.single.path, '/member/giving/funds');
    expect(dio.requests.single.authorization, 'Bearer member-token');
  });

  test('fetches member giving overview from backend', () async {
    final dio = _GivingDio();
    final repository = ApiGivingRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );
    final year = DateTime.now().year;

    final overview = await repository.fetchMemberOverview(_memberSession);

    expect(overview.transactions.single.id, 'giving-1');
    expect(overview.summary.totalAmountCents, 5000);
    expect(overview.statements.single.taxYear, 2025);
    expect(dio.requests.map((request) => request.path), [
      '/member/giving/transactions?year=$year&limit=20',
      '/member/giving/statements?limit=20',
    ]);
    expect(
      dio.requests.every(
        (request) => request.authorization == 'Bearer member-token',
      ),
      isTrue,
    );
  });

  test('creates checkout session with backend fund allocation', () async {
    final dio = _GivingDio();
    final repository = ApiGivingRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final checkout = await repository.createCheckoutSession(
      session: _memberSession,
      amountCents: 2500,
      category: 'missions',
      fundId: 'fund-missions',
    );

    expect(checkout.checkoutSessionId, 'cs_test_123');
    expect(dio.requests.single.path, '/member/giving/checkout-sessions');
    expect(dio.requests.single.authorization, 'Bearer member-token');
    expect(dio.requests.single.data, {
      'amountCents': 2500,
      'currency': 'USD',
      'category': 'missions',
      'fundId': 'fund-missions',
      'donorName': 'Member',
      'donorEmail': 'member@example.com',
    });
  });

  test('fetches annual statement export through backend', () async {
    final dio = _GivingDio();
    final repository = ApiGivingRepository(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    final export = await repository.fetchStatementExport(
      session: _memberSession,
      year: 2025,
    );

    expect(export.filename, 'giving-statement-2025.csv');
    expect(export.csv, contains('giving-1'));
    expect(export.pdfBase64, 'JVBERi0xLjQ=');
    expect(dio.requests.single.path, '/member/giving/statements/2025/download');
    expect(dio.requests.single.authorization, 'Bearer member-token');
  });
}

class _GivingDio {
  _GivingDio() {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedGivingRequest(
              path: options.path,
              authorization: options.headers['authorization'] as String?,
              data: options.data,
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: _responseFor(options.path),
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final List<_RecordedGivingRequest> requests = [];

  Map<String, Object?> _responseFor(String path) {
    if (path == '/member/giving/funds') {
      return const {
        'data': {
          'items': [_offeringFundJson, _missionsFundJson],
        },
        'meta': <String, Object?>{},
      };
    }
    if (path.startsWith('/member/giving/transactions')) {
      return const {
        'data': {
          'items': [_transactionJson],
          'summary': _summaryJson,
        },
        'meta': <String, Object?>{},
      };
    }
    if (path == '/member/giving/statements?limit=20') {
      return const {
        'data': {
          'items': [_statementJson],
        },
        'meta': <String, Object?>{},
      };
    }
    if (path == '/member/giving/checkout-sessions') {
      return const {
        'data': {
          'provider': 'stripe',
          'checkoutSessionId': 'cs_test_123',
          'checkoutUrl': 'https://checkout.stripe.test/session',
          'transactionId': 'giving-pending-1',
        },
        'meta': <String, Object?>{},
      };
    }
    return const {
      'data': {
        'filename': 'giving-statement-2025.csv',
        'contentType': 'text/csv',
        'csv': 'statementId,giving-1',
        'pdfBase64': 'JVBERi0xLjQ=',
      },
      'meta': <String, Object?>{},
    };
  }
}

class _RecordedGivingRequest {
  const _RecordedGivingRequest({
    required this.path,
    required this.authorization,
    required this.data,
  });

  final String path;
  final String? authorization;
  final Object? data;
}

const _offeringFundJson = {
  'id': 'fund-offering',
  'code': 'offering',
  'name': 'General Offering',
  'description': 'General church offering.',
  'status': 'active',
  'targetAmountCents': null,
  'displayOrder': 10,
  'totalAmountCents': 5000,
  'transactionCount': 1,
  'createdAt': '2026-01-01T00:00:00.000Z',
  'updatedAt': '2026-01-01T00:00:00.000Z',
};

const _missionsFundJson = {
  'id': 'fund-missions',
  'code': 'missions',
  'name': 'Missions',
  'description': 'Missions and outreach giving.',
  'status': 'active',
  'targetAmountCents': null,
  'displayOrder': 20,
  'totalAmountCents': 0,
  'transactionCount': 0,
  'createdAt': '2026-01-01T00:00:00.000Z',
  'updatedAt': '2026-01-01T00:00:00.000Z',
};

const _transactionJson = {
  'id': 'giving-1',
  'amountCents': 5000,
  'currency': 'USD',
  'category': 'offering',
  'status': 'succeeded',
  'givenAt': '2026-05-10T18:30:00.000Z',
};

const _summaryJson = {
  'year': 2026,
  'totalAmountCents': 5000,
  'transactionCount': 1,
  'currency': 'USD',
};

const _statementJson = {
  'id': 'statement-2025',
  'taxYear': 2025,
  'totalAmountCents': 8000,
  'currency': 'USD',
  'status': 'ready',
  'generatedAt': '2026-01-15T00:00:00.000Z',
};

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

const _testAppConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: false,
);
