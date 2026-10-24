import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/features/member_auth/presentation/member_auth_error_message.dart';

void main() {
  test('preserves backend member auth messages', () {
    const error = ApiError(message: 'The verification code is invalid.');

    expect(
      memberAuthErrorMessage(error, fallback: 'Try again.'),
      'The verification code is invalid.',
    );
  });

  test('hides local member auth implementation failures', () {
    const error = FormatException('Missing member response object: data');

    expect(memberAuthErrorMessage(error, fallback: 'Try again.'), 'Try again.');
  });
}
