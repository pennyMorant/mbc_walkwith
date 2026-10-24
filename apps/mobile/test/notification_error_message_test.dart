import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/features/life/presentation/notification_error_message.dart';

void main() {
  test('preserves backend notification messages', () {
    const error = ApiError(message: 'The notification was archived.');

    expect(
      notificationErrorMessage(error, fallback: 'Try again.'),
      'The notification was archived.',
    );
  });

  test('hides local notification implementation failures', () {
    final error = StateError('Remote inbox mutation failed.');

    expect(
      notificationErrorMessage(error, fallback: 'Try again.'),
      'Try again.',
    );
  });
}
