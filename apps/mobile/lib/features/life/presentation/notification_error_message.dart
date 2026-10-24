import '../../../core/api/api_error.dart';

String notificationErrorMessage(Object error, {required String fallback}) {
  if (error is ApiError && error.message.trim().isNotEmpty) {
    return error.message;
  }
  return fallback;
}
