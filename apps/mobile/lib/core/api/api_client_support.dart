import 'package:dio/dio.dart';

import 'api_error.dart';

Map<String, String> apiIdentityHeaders({
  String? accessToken,
  String? externalUserId,
}) {
  return {
    if (accessToken != null && accessToken.isNotEmpty)
      'authorization': 'Bearer $accessToken',
    if (externalUserId != null && externalUserId.isNotEmpty)
      'x-external-user-id': externalUserId,
  };
}

ApiError apiErrorFromDioException(DioException error) {
  final response = error.response;
  final data = response?.data;
  final requestIdFromHeader = response?.headers.value('x-request-id');

  if (data is Map<String, Object?>) {
    final errorBody = data['error'];
    final requestId = data['requestId'] as String? ?? requestIdFromHeader;
    final message =
        data['message'] as String? ??
        (errorBody is Map<String, Object?>
            ? errorBody['message'] as String?
            : null) ??
        data['error'] as String?;
    if (message != null && message.isNotEmpty) {
      if (errorBody is Map<String, Object?>) {
        return ApiError(
          message: message,
          statusCode: response?.statusCode,
          requestId: requestId,
          code: errorBody['code'] as String?,
          category: errorBody['category'] as String?,
          sourceLayer: errorBody['sourceLayer'] as String?,
          recoverable: errorBody['recoverable'] as bool?,
          retryable: errorBody['retryable'] as bool?,
          evidence: _asMap(errorBody['evidence']),
          nextAction: errorBody['nextAction'] as String?,
          details: _asMap(errorBody['details']),
        );
      }
      return ApiError(
        message: message,
        statusCode: response?.statusCode,
        requestId: requestId,
      );
    }
  }

  return ApiError(
    message: error.message ?? 'Network request failed',
    statusCode: response?.statusCode,
    requestId: requestIdFromHeader,
    code: 'network_request_failed',
    category: 'network',
    sourceLayer: 'external',
    recoverable: true,
    retryable: true,
    nextAction: 'retry',
  );
}

String newApiRequestId() {
  return DateTime.now().microsecondsSinceEpoch.toRadixString(16);
}

Map<String, Object?> _asMap(Object? value) {
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, value) => MapEntry(key.toString(), value));
  }
  return const {};
}
