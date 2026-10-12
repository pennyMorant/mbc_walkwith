class ApiError implements Exception {
  const ApiError({
    required this.message,
    this.statusCode,
    this.requestId,
    this.code,
    this.category,
    this.sourceLayer,
    this.recoverable,
    this.retryable,
    this.evidence = const {},
    this.nextAction,
    this.details = const {},
  });

  final String message;
  final int? statusCode;
  final String? requestId;
  final String? code;
  final String? category;
  final String? sourceLayer;
  final bool? recoverable;
  final bool? retryable;
  final Map<String, Object?> evidence;
  final String? nextAction;
  final Map<String, Object?> details;

  bool get isNotFound => category == 'not_found' || statusCode == 404;

  bool get isAuthenticationRequired =>
      category == 'authentication_required' || statusCode == 401;

  bool get isPermissionDenied =>
      category == 'permission_denied' || statusCode == 403;

  bool get isValidationFailure =>
      category == 'validation_error' || statusCode == 400;

  bool get isStateConflict => category == 'state_conflict' || statusCode == 409;

  bool get isConfigurationMissing => category == 'configuration_missing';

  bool get isCapabilityFailure =>
      sourceLayer == 'capability' || category == 'external_dependency_failed';

  bool hasCode(Iterable<String> codes) {
    final value = code;
    return value != null && codes.contains(value);
  }

  @override
  String toString() {
    final status = statusCode == null ? '' : ' ($statusCode)';
    final id = requestId == null ? '' : ' requestId=$requestId';
    final apiCode = code == null ? '' : ' code=$code';
    return 'ApiError$status$apiCode: $message$id';
  }
}

String formatApiErrorMessage(Object error) {
  if (error is ApiError) {
    return error.message;
  }
  return error.toString();
}
