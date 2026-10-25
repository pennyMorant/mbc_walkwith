import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_response_parser.dart';

void main() {
  const parser = MemberSessionResponseParser();

  test('parses a signed-in registration session', () {
    final result = parser.registrationFromEnvelope({
      'data': {
        'status': 'signed_in',
        'session': {'accessToken': 'member-token', 'member': _memberJson},
      },
    });

    expect(result.status, 'signed_in');
    expect(result.session?.accessToken, 'member-token');
    expect(result.session?.member.id, 'member-1');
  });

  test('parses a registration pending administrator approval', () {
    final result = parser.registrationFromEnvelope({
      'data': {'status': 'pending_approval', 'member': _memberJson},
    });

    expect(result.status, 'pending_approval');
    expect(result.member?.email, 'member@example.com');
    expect(result.session, isNull);
  });

  test('parses a registration email challenge', () {
    final result = parser.registrationFromEnvelope({
      'data': {
        'status': 'pending_email_verification',
        'codeRequest': {
          'challengeId': 'challenge-1',
          'expiresInSeconds': 600,
          'resendAfterSeconds': 60,
          'maskedEmail': 'm***@example.com',
        },
      },
    });

    expect(result.status, 'pending_email_verification');
    expect(result.codeRequest?.challengeId, 'challenge-1');
    expect(result.codeRequest?.resendAfterSeconds, 60);
  });

  test('rejects an unknown registration state', () {
    expect(
      () => parser.registrationFromEnvelope({
        'data': {'status': 'unexpected'},
      }),
      throwsFormatException,
    );
  });

  test('rejects a malformed password reset challenge', () {
    expect(
      () => parser.codeRequestFromEnvelope({
        'data': {
          'challengeId': 'challenge-1',
          'expiresInSeconds': -1,
          'resendAfterSeconds': 60,
        },
      }),
      throwsFormatException,
    );
  });

  test('rejects unknown member status and role values', () {
    expect(
      () => parser.registrationFromEnvelope({
        'data': {
          'status': 'signed_in',
          'session': {
            'accessToken': 'member-token',
            'member': {..._memberJson, 'status': 'unexpected'},
          },
        },
      }),
      throwsFormatException,
    );
    expect(
      () => parser.registrationFromEnvelope({
        'data': {
          'status': 'signed_in',
          'session': {
            'accessToken': 'member-token',
            'member': {
              ..._memberJson,
              'roles': <Object?>['member', 'unexpected'],
            },
          },
        },
      }),
      throwsFormatException,
    );
  });
}

const _memberJson = <String, Object?>{
  'id': 'member-1',
  'email': 'member@example.com',
  'displayName': 'Member',
  'phone': null,
  'address': null,
  'faithStartYear': null,
  'baptizedYear': null,
  'joinedChurchAt': null,
  'emergencyContactName': null,
  'emergencyContactPhone': null,
  'status': 'active',
  'roles': <Object?>['member'],
  'appLocale': 'en',
  'fellowshipGroupId': null,
  'notificationSettings': <String, Object?>{
    'weeklyBulletin': true,
    'sermonPublished': true,
    'lifePostPublished': true,
    'prayerUpdates': false,
  },
};
