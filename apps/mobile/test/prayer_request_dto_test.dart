import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/dto/prayer_request_dto.dart';

void main() {
  test('maps a complete prayer response into the domain model', () {
    final request = readPrayerResponse({
      'data': _validPrayer,
      'meta': <String, Object?>{},
    });

    expect(request.id, 'prayer-1');
    expect(request.visibility, 'group');
    expect(request.groupId, 'friday-fellowship');
    expect(request.status, 'approved');
  });

  test('rejects malformed envelopes instead of returning an empty feed', () {
    expect(() => readPrayerItems(const {}), throwsFormatException);
    expect(
      () => readPrayerItems(const {
        'data': {
          'items': ['not-an-object'],
        },
      }),
      throwsFormatException,
    );
  });

  test('rejects unsupported state and invalid group scope', () {
    expect(
      () => PrayerRequestDto.fromJson({..._validPrayer, 'status': 'unknown'}),
      throwsFormatException,
    );
    expect(
      () => PrayerRequestDto.fromJson({..._validPrayer, 'groupId': null}),
      throwsFormatException,
    );
    expect(
      () =>
          PrayerRequestDto.fromJson({..._validPrayer, 'visibility': 'private'}),
      throwsFormatException,
    );
  });

  test('rejects missing identifiers and impossible timestamps', () {
    expect(
      () => PrayerRequestDto.fromJson({..._validPrayer, 'id': ''}),
      throwsFormatException,
    );
    expect(
      () => PrayerRequestDto.fromJson({
        ..._validPrayer,
        'updatedAt': '2026-06-20T10:00:00.000Z',
      }),
      throwsFormatException,
    );
  });
}

const _validPrayer = <String, Object?>{
  'id': 'prayer-1',
  'title': 'Group care',
  'body': 'Please pray for our fellowship group.',
  'visibility': 'group',
  'groupId': 'friday-fellowship',
  'status': 'approved',
  'submitterName': 'Member',
  'createdAt': '2026-06-21T18:00:00.000Z',
  'updatedAt': '2026-06-21T18:20:00.000Z',
};
