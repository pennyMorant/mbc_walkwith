import '../../domain/giving_record.dart';
import 'giving_json_reader.dart';

const _transactionStatuses = {'pending', 'succeeded', 'failed', 'refunded'};
const _statementStatuses = {'pending', 'ready', 'sent', 'failed'};

class GivingTransactionDto {
  const GivingTransactionDto({
    required this.id,
    required this.amountCents,
    required this.currency,
    required this.category,
    required this.status,
    required this.givenAt,
  });

  factory GivingTransactionDto.fromJson(Map<String, Object?> json) {
    return GivingTransactionDto(
      id: readGivingString(json, 'id', allowEmpty: false),
      amountCents: readGivingNonNegativeInt(json, 'amountCents'),
      currency: readGivingString(
        json,
        'currency',
        allowEmpty: false,
        defaultValue: 'USD',
      ),
      category: readGivingString(json, 'category', allowEmpty: false),
      status: readGivingEnum(json, 'status', _transactionStatuses),
      givenAt: readGivingDateTime(json, 'givenAt'),
    );
  }

  final String id;
  final int amountCents;
  final String currency;
  final String category;
  final String status;
  final DateTime givenAt;

  GivingTransaction toDomain() => GivingTransaction(
    id: id,
    amountCents: amountCents,
    currency: currency,
    category: category,
    status: status,
    givenAt: givenAt,
  );
}

class GivingStatementDto {
  const GivingStatementDto({
    required this.id,
    required this.taxYear,
    required this.totalAmountCents,
    required this.currency,
    required this.status,
    required this.generatedAt,
  });

  factory GivingStatementDto.fromJson(Map<String, Object?> json) {
    final taxYear = readGivingInt(json, 'taxYear');
    if (taxYear < 2000 || taxYear > 2100) {
      throw const FormatException('taxYear must be between 2000 and 2100.');
    }
    return GivingStatementDto(
      id: readGivingString(json, 'id', allowEmpty: false),
      taxYear: taxYear,
      totalAmountCents: readGivingNonNegativeInt(json, 'totalAmountCents'),
      currency: readGivingString(
        json,
        'currency',
        allowEmpty: false,
        defaultValue: 'USD',
      ),
      status: readGivingEnum(json, 'status', _statementStatuses),
      generatedAt: readNullableGivingDateTime(json, 'generatedAt'),
    );
  }

  final String id;
  final int taxYear;
  final int totalAmountCents;
  final String currency;
  final String status;
  final DateTime? generatedAt;

  GivingStatement toDomain() => GivingStatement(
    id: id,
    taxYear: taxYear,
    totalAmountCents: totalAmountCents,
    currency: currency,
    status: status,
    generatedAt: generatedAt,
  );
}

class GivingSummaryDto {
  const GivingSummaryDto({
    required this.year,
    required this.totalAmountCents,
    required this.transactionCount,
    required this.currency,
  });

  factory GivingSummaryDto.fromJson(Map<String, Object?> json) {
    final year = readGivingInt(json, 'year');
    if (year < 2000 || year > 2100) {
      throw const FormatException('year must be between 2000 and 2100.');
    }
    return GivingSummaryDto(
      year: year,
      totalAmountCents: readGivingNonNegativeInt(json, 'totalAmountCents'),
      transactionCount: readGivingNonNegativeInt(json, 'transactionCount'),
      currency: readGivingString(json, 'currency', allowEmpty: false),
    );
  }

  final int year;
  final int totalAmountCents;
  final int transactionCount;
  final String currency;

  GivingSummary toDomain() => GivingSummary(
    year: year,
    totalAmountCents: totalAmountCents,
    transactionCount: transactionCount,
    currency: currency,
  );
}

GivingOverview readGivingOverview({
  required Map<String, Object?> transactionsResponse,
  required Map<String, Object?> statementsResponse,
}) {
  final transactionsData = readGivingData(transactionsResponse);
  final statementsData = readGivingData(statementsResponse);
  return GivingOverview(
    transactions: readGivingObjectList(transactionsData, 'items')
        .map(GivingTransactionDto.fromJson)
        .map((dto) => dto.toDomain())
        .toList(growable: false),
    summary: GivingSummaryDto.fromJson(
      _readGivingObject(transactionsData, 'summary'),
    ).toDomain(),
    statements: readGivingObjectList(statementsData, 'items')
        .map(GivingStatementDto.fromJson)
        .map((dto) => dto.toDomain())
        .toList(growable: false),
  );
}

Map<String, Object?> _readGivingObject(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! Map<String, Object?>) {
    throw FormatException('$key must be an object.');
  }
  return value;
}
