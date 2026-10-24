import 'member_session_models.dart';

class MemberSessionResponseParser {
  const MemberSessionResponseParser();

  MemberSession sessionFromEnvelope(Map<String, Object?> response) {
    return sessionFromData(_envelopeData(response));
  }

  MemberSession sessionFromData(Map<String, Object?> data) {
    return MemberSession(
      accessToken: _requiredString(data, 'accessToken'),
      member: MemberProfile.fromJson(_requiredMap(data, 'member')),
    );
  }

  MemberRegistrationResult firebaseSignInFromEnvelope(
    Map<String, Object?> response,
  ) {
    final data = _envelopeData(response);
    return switch (_requiredString(data, 'status')) {
      'signed_in' => MemberRegistrationResult.signedIn(
        sessionFromData(_requiredMap(data, 'session')),
      ),
      'pending_approval' => MemberRegistrationResult.pendingApproval(
        MemberProfile.fromJson(_requiredMap(data, 'member')),
      ),
      _ => throw const FormatException(
        'Unknown member Firebase authentication status.',
      ),
    };
  }

  MemberRegistrationResult registrationFromEnvelope(
    Map<String, Object?> response,
  ) {
    final data = _envelopeData(response);
    final status = _requiredString(data, 'status');
    return switch (status) {
      'signed_in' => MemberRegistrationResult.signedIn(
        sessionFromData(_requiredMap(data, 'session')),
      ),
      'pending_approval' => MemberRegistrationResult.pendingApproval(
        MemberProfile.fromJson(_requiredMap(data, 'member')),
      ),
      'pending_email_verification' =>
        MemberRegistrationResult.pendingEmailVerification(
          codeRequestFromData(_requiredMap(data, 'codeRequest')),
        ),
      _ => throw FormatException('Unknown member registration status: $status'),
    };
  }

  MemberRegistrationResult verificationFromEnvelope(
    Map<String, Object?> response,
  ) {
    final data = _envelopeData(response);
    if (data['status'] == 'pending_approval') {
      return MemberRegistrationResult.pendingApproval(
        MemberProfile.fromJson(_requiredMap(data, 'member')),
      );
    }
    return MemberRegistrationResult.signedIn(sessionFromData(data));
  }

  MemberCodeRequestResult codeRequestFromEnvelope(
    Map<String, Object?> response,
  ) {
    return codeRequestFromData(_envelopeData(response));
  }

  MemberCodeRequestResult codeRequestFromData(Map<String, Object?> data) {
    return MemberCodeRequestResult(
      challengeId: _requiredString(data, 'challengeId'),
      expiresInSeconds: _requiredInt(data, 'expiresInSeconds'),
      maskedEmail: data['maskedEmail'] as String?,
      resendAfterSeconds: _requiredInt(data, 'resendAfterSeconds'),
      devCode: data['devCode'] as String?,
    );
  }
}

Map<String, Object?> _envelopeData(Map<String, Object?> response) {
  return response['data'] as Map<String, Object?>? ?? const {};
}

Map<String, Object?> _requiredMap(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is Map<String, Object?>) {
    return value;
  }
  throw FormatException('Missing member response object: $key');
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is String && value.trim().isNotEmpty) {
    return value;
  }
  throw FormatException('Missing member response text: $key');
}

int _requiredInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is int && value >= 0) {
    return value;
  }
  throw FormatException('Missing member response number: $key');
}
