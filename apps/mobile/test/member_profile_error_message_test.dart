import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/features/mine/presentation/member_profile_error_message.dart';

void main() {
  test('preserves backend profile messages', () {
    const error = ApiError(message: 'The profile update was rejected.');

    expect(
      memberProfileErrorMessage(error, fallback: 'Try again.'),
      'The profile update was rejected.',
    );
  });

  test('hides local profile implementation failures', () {
    final error = StateError('Secure storage is unavailable.');

    expect(
      memberProfileErrorMessage(error, fallback: 'Try again.'),
      'Try again.',
    );
  });
}
