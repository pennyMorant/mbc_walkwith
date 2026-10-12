import '../../domain/giving_record.dart';
import 'giving_json_reader.dart';

class GivingCheckoutSessionDto {
  const GivingCheckoutSessionDto({
    required this.checkoutSessionId,
    required this.checkoutUrl,
    required this.transactionId,
  });

  factory GivingCheckoutSessionDto.fromJson(Map<String, Object?> json) {
    final checkoutUrl = readGivingString(
      json,
      'checkoutUrl',
      allowEmpty: false,
    );
    final uri = Uri.tryParse(checkoutUrl);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      throw const FormatException('checkoutUrl must be an absolute URL.');
    }
    return GivingCheckoutSessionDto(
      checkoutSessionId: readGivingString(
        json,
        'checkoutSessionId',
        allowEmpty: false,
      ),
      checkoutUrl: checkoutUrl,
      transactionId: readGivingString(json, 'transactionId', allowEmpty: false),
    );
  }

  final String checkoutSessionId;
  final String checkoutUrl;
  final String transactionId;

  GivingCheckoutSession toDomain() => GivingCheckoutSession(
    checkoutSessionId: checkoutSessionId,
    checkoutUrl: checkoutUrl,
    transactionId: transactionId,
  );
}

GivingCheckoutSession readGivingCheckoutSession(Map<String, Object?> response) {
  return GivingCheckoutSessionDto.fromJson(readGivingData(response)).toDomain();
}

GivingStatementExport readGivingStatementExport(Map<String, Object?> response) {
  final data = readGivingData(response);
  final pdfBase64 = data['pdfBase64'];
  if (pdfBase64 != null && pdfBase64 is! String) {
    throw const FormatException('pdfBase64 must be null or a string.');
  }
  return GivingStatementExport(
    filename: readGivingString(data, 'filename', allowEmpty: false),
    contentType: readGivingString(data, 'contentType', allowEmpty: false),
    csv: readGivingString(data, 'csv'),
    pdfBase64: pdfBase64 as String?,
  );
}
