import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/mine/presentation/member_profile_input_validation.dart';

void main() {
  test('optional member years follow the API range', () {
    expect(isValidOptionalMemberYear(''), isTrue);
    expect(isValidOptionalMemberYear('1900'), isTrue);
    expect(isValidOptionalMemberYear('2100'), isTrue);
    expect(isValidOptionalMemberYear('1899'), isFalse);
    expect(isValidOptionalMemberYear('not-a-year'), isFalse);
  });

  test('optional profile date requires a real ISO calendar date', () {
    expect(isValidOptionalIsoDate(''), isTrue);
    expect(isValidOptionalIsoDate('2024-02-29'), isTrue);
    expect(isValidOptionalIsoDate('2025-02-29'), isFalse);
    expect(isValidOptionalIsoDate('2025-13-01'), isFalse);
    expect(isValidOptionalIsoDate('06/20/2025'), isFalse);
  });
}
