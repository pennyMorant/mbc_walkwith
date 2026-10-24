import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/features/life/presentation/giving_error_message.dart';

void main() {
  test('giving errors retain explicit backend messages', () {
    expect(
      givingErrorMessage(
        const ApiError(message: 'This giving fund is unavailable.'),
        fallback: 'Try again.',
      ),
      'This giving fund is unavailable.',
    );
  });

  test('giving errors hide unexpected implementation details', () {
    expect(
      givingErrorMessage(
        const FormatException('amountCents is malformed'),
        fallback: 'Try again.',
      ),
      'Try again.',
    );
  });
}
