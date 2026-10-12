import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/dto/giving_checkout_dto.dart';
import 'package:mbc_walkwith/features/life/data/dto/giving_fund_dto.dart';
import 'package:mbc_walkwith/features/life/data/dto/giving_record_dto.dart';

void main() {
  group('giving DTO boundary', () {
    test('maps valid financial responses without fallback values', () {
      final overview = readGivingOverview(
        transactionsResponse: {
          'data': {
            'items': [_transactionJson],
            'summary': _summaryJson,
          },
        },
        statementsResponse: {
          'data': {
            'items': [_statementJson],
          },
        },
      );

      expect(overview.transactions.single.id, 'giving-1');
      expect(overview.transactions.single.givenAt.year, 2026);
      expect(overview.summary.totalAmountCents, 5000);
      expect(overview.statements.single.status, 'ready');
    });

    test('rejects a transaction with a missing identity or invalid status', () {
      expect(
        () => GivingTransactionDto.fromJson({..._transactionJson, 'id': ''}),
        throwsFormatException,
      );
      expect(
        () => GivingTransactionDto.fromJson({
          ..._transactionJson,
          'status': 'complete',
        }),
        throwsFormatException,
      );
    });

    test('rejects invalid financial dates and negative amounts', () {
      expect(
        () => GivingTransactionDto.fromJson({
          ..._transactionJson,
          'givenAt': 'not-a-date',
        }),
        throwsFormatException,
      );
      expect(
        () => GivingStatementDto.fromJson({
          ..._statementJson,
          'totalAmountCents': -1,
        }),
        throwsFormatException,
      );
    });

    test('rejects inactive funds from the member active-fund endpoint', () {
      expect(
        () => readActiveGivingFunds({
          'data': {
            'items': [
              {..._fundJson, 'status': 'paused'},
            ],
          },
        }),
        throwsFormatException,
      );
    });

    test('rejects malformed checkout and export payloads', () {
      expect(
        () => readGivingCheckoutSession({
          'data': {
            'checkoutSessionId': 'cs_test_1',
            'checkoutUrl': 'not-a-url',
            'transactionId': 'giving-pending-1',
          },
        }),
        throwsFormatException,
      );
      expect(
        () => readGivingStatementExport({
          'data': {
            'filename': 'giving-statement-2025.csv',
            'contentType': 'text/csv',
            'csv': '',
            'pdfBase64': 42,
          },
        }),
        throwsFormatException,
      );
    });
  });
}

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

const _fundJson = {
  'id': 'fund-offering',
  'code': 'offering',
  'name': 'General Offering',
  'description': 'General church offering.',
  'status': 'active',
  'targetAmountCents': null,
  'displayOrder': 10,
};
