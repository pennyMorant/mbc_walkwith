import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/dto/life_post_dto.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';

void main() {
  test('parses canonical checked-in event state into typed domain values', () {
    final post = LifePostDto.fromJson(_validLifePostJson()).toDomain();

    expect(
      post.registrationSummary?.myRegistrationStatus,
      EventRegistrationStatus.checkedIn,
    );
    expect(
      post.registrationSummary?.myCheckInMethod,
      EventCheckInMethod.onsiteQr,
    );
    expect(post.registrationSummary?.remainingCount, 8);
  });

  test('rejects unsupported registration status', () {
    final json = _validLifePostJson();
    _summary(json)['myRegistrationStatus'] = 'waiting';

    expect(() => LifePostDto.fromJson(json), throwsFormatException);
  });

  test('rejects malformed dates and inconsistent registration counts', () {
    final badDate = _validLifePostJson()..['updatedAt'] = 'not-a-date';
    final badCount = _validLifePostJson();
    _summary(badCount)['remainingCount'] = 7;

    expect(() => LifePostDto.fromJson(badDate), throwsFormatException);
    expect(() => LifePostDto.fromJson(badCount), throwsFormatException);
  });

  test('rejects checked-in state without canonical attendance metadata', () {
    final json = _validLifePostJson();
    _summary(json)['myCheckedInAt'] = null;

    expect(() => LifePostDto.fromJson(json), throwsFormatException);
  });

  test('rejects summary configuration that disagrees with the post', () {
    final json = _validLifePostJson();
    _summary(json)['capacity'] = 12;

    expect(() => LifePostDto.fromJson(json), throwsFormatException);
  });
}

Map<String, Object?> _validLifePostJson() {
  return {
    'id': 'event-1',
    'type': 'fellowship',
    'title': 'Friday Fellowship',
    'body': 'Dinner and prayer.',
    'meta': 'Friday 7:30 PM',
    'iconName': 'groups',
    'startsAt': '2026-07-17T19:30:00.000Z',
    'endsAt': '2026-07-17T21:00:00.000Z',
    'visibility': 'members',
    'status': 'published',
    'imageUrl': null,
    'displayWeight': 50,
    'ctaLabel': null,
    'ctaUrl': null,
    'registrationEnabled': true,
    'registrationCapacity': 10,
    'registrationDeadline': '2026-07-17T18:00:00.000Z',
    'registrationAllowCancellation': true,
    'registrationMaxPartySize': 4,
    'registrationSummary': <String, Object?>{
      'enabled': true,
      'capacity': 10,
      'registeredCount': 2,
      'remainingCount': 8,
      'myRegistrationStatus': 'checked_in',
      'myPartySize': 2,
      'myNote': 'Need two seats.',
      'myCheckedInAt': '2026-07-17T19:25:00.000Z',
      'myCheckInMethod': 'onsite_qr',
    },
    'updatedAt': '2026-07-10T18:00:00.000Z',
    'isRead': false,
    'readAt': null,
  };
}

Map<String, Object?> _summary(Map<String, Object?> json) =>
    json['registrationSummary']! as Map<String, Object?>;
