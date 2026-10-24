import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/features/life/presentation/life_action_error_message.dart';

void main() {
  test('keeps explicit API messages', () {
    expect(
      lifeActionErrorMessage(
        const ApiError(message: 'The group is full.'),
        fallback: 'Try again.',
      ),
      'The group is full.',
    );
  });

  test('hides unexpected implementation errors', () {
    expect(
      lifeActionErrorMessage(
        StateError('database connection leaked'),
        fallback: 'Try again.',
      ),
      'Try again.',
    );
  });
}
