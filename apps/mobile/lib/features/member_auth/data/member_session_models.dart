class MemberCodeRequestResult {
  const MemberCodeRequestResult({
    required this.challengeId,
    required this.expiresInSeconds,
    required this.resendAfterSeconds,
    this.maskedEmail,
    this.devCode,
  });

  final String challengeId;
  final int expiresInSeconds;
  final int resendAfterSeconds;
  final String? maskedEmail;
  final String? devCode;
}

class MemberRegistrationResult {
  const MemberRegistrationResult._({
    required this.status,
    this.session,
    this.codeRequest,
    this.member,
  });

  factory MemberRegistrationResult.signedIn(MemberSession session) {
    return MemberRegistrationResult._(status: 'signed_in', session: session);
  }

  factory MemberRegistrationResult.pendingEmailVerification(
    MemberCodeRequestResult codeRequest,
  ) {
    return MemberRegistrationResult._(
      status: 'pending_email_verification',
      codeRequest: codeRequest,
    );
  }

  factory MemberRegistrationResult.pendingApproval(MemberProfile member) {
    return MemberRegistrationResult._(
      status: 'pending_approval',
      member: member,
    );
  }

  final String status;
  final MemberSession? session;
  final MemberCodeRequestResult? codeRequest;
  final MemberProfile? member;
}

class MemberSession {
  const MemberSession({required this.accessToken, required this.member});

  final String accessToken;
  final MemberProfile member;
}

class MemberNotificationSettings {
  const MemberNotificationSettings({
    required this.weeklyBulletin,
    required this.sermonPublished,
    required this.lifePostPublished,
    required this.prayerUpdates,
  });

  static const defaults = MemberNotificationSettings(
    weeklyBulletin: true,
    sermonPublished: true,
    lifePostPublished: true,
    prayerUpdates: false,
  );

  final bool weeklyBulletin;
  final bool sermonPublished;
  final bool lifePostPublished;
  final bool prayerUpdates;

  factory MemberNotificationSettings.fromJson(Map<String, Object?> json) {
    return MemberNotificationSettings(
      weeklyBulletin: _requiredBool(json, 'weeklyBulletin'),
      sermonPublished: _requiredBool(json, 'sermonPublished'),
      lifePostPublished: _requiredBool(json, 'lifePostPublished'),
      prayerUpdates: _requiredBool(json, 'prayerUpdates'),
    );
  }

  Map<String, Object?> toJson() {
    return {
      'weeklyBulletin': weeklyBulletin,
      'sermonPublished': sermonPublished,
      'lifePostPublished': lifePostPublished,
      'prayerUpdates': prayerUpdates,
    };
  }
}

class MemberProfile {
  const MemberProfile({
    required this.id,
    required this.email,
    required this.displayName,
    required this.roles,
    required this.appLocale,
    required this.fellowshipGroupId,
    required this.notificationSettings,
    this.phone,
    this.address,
    this.faithStartYear,
    this.baptizedYear,
    this.joinedChurchAt,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.status = 'active',
  });

  final String id;
  final String email;
  final String displayName;
  final String? phone;
  final String? address;
  final int? faithStartYear;
  final int? baptizedYear;
  final String? joinedChurchAt;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String status;
  final List<String> roles;
  final String appLocale;
  final String? fellowshipGroupId;
  final MemberNotificationSettings notificationSettings;

  factory MemberProfile.fromJson(Map<String, Object?> json) {
    final roles = json['roles'];
    final notificationSettings = json['notificationSettings'];
    if (roles is! List<Object?> || roles.isEmpty) {
      throw const FormatException('Member roles are missing.');
    }
    if (notificationSettings is! Map<String, Object?>) {
      throw const FormatException('Member notification settings are missing.');
    }
    return MemberProfile(
      id: _requiredString(json, 'id'),
      email: _requiredString(json, 'email'),
      displayName: _requiredString(json, 'displayName'),
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      faithStartYear: json['faithStartYear'] as int?,
      baptizedYear: json['baptizedYear'] as int?,
      joinedChurchAt: json['joinedChurchAt'] as String?,
      emergencyContactName: json['emergencyContactName'] as String?,
      emergencyContactPhone: json['emergencyContactPhone'] as String?,
      status: _requiredString(json, 'status'),
      roles: roles
          .map((role) {
            if (role is! String || role.isEmpty) {
              throw const FormatException('Member role is invalid.');
            }
            return role;
          })
          .toList(growable: false),
      appLocale: _requiredString(json, 'appLocale'),
      fellowshipGroupId: json['fellowshipGroupId'] as String?,
      notificationSettings: MemberNotificationSettings.fromJson(
        notificationSettings,
      ),
    );
  }

  Map<String, Object?> toJson() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'phone': phone,
      'address': address,
      'faithStartYear': faithStartYear,
      'baptizedYear': baptizedYear,
      'joinedChurchAt': joinedChurchAt,
      'emergencyContactName': emergencyContactName,
      'emergencyContactPhone': emergencyContactPhone,
      'status': status,
      'roles': roles,
      'appLocale': appLocale,
      'fellowshipGroupId': fellowshipGroupId,
      'notificationSettings': notificationSettings.toJson(),
    };
  }
}

String _requiredString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is String && value.trim().isNotEmpty) {
    return value;
  }
  throw FormatException('Member field is missing: $key');
}

bool _requiredBool(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is bool) {
    return value;
  }
  throw FormatException('Member preference is missing: $key');
}
