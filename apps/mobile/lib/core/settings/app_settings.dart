class AppSettings {
  const AppSettings({
    required this.churchName,
    required this.defaultLocale,
    required this.prayerEnabled,
    required this.givingEnabled,
    this.churchAbout = '',
    this.churchAddress = '',
    this.churchMapUrl = '',
    this.churchContactPhone = '',
    this.churchContactEmail = '',
    this.privacyPolicyUrl = '',
    this.termsOfUseUrl = '',
    this.memberRegistrationMode = 'open',
    this.memberRequireEmailVerification = true,
    this.memberRequireAdminApproval = false,
    this.memberRegistrationHelpText = '',
  });

  factory AppSettings.fromSettingMap(Map<String, Object?> values) {
    return AppSettings(
      churchName: _stringValue(values['church.name'], defaults.churchName),
      defaultLocale: _stringValue(
        values['app.defaultLocale'],
        defaults.defaultLocale,
      ),
      churchAbout: _stringValue(values['church.about'], defaults.churchAbout),
      churchAddress: _stringValue(
        values['church.address'],
        defaults.churchAddress,
      ),
      churchMapUrl: _stringValue(
        values['church.mapUrl'],
        defaults.churchMapUrl,
      ),
      churchContactPhone: _stringValue(
        values['church.contactPhone'],
        defaults.churchContactPhone,
      ),
      churchContactEmail: _stringValue(
        values['church.contactEmail'],
        defaults.churchContactEmail,
      ),
      privacyPolicyUrl: _stringValue(
        values['legal.privacyPolicyUrl'],
        defaults.privacyPolicyUrl,
      ),
      termsOfUseUrl: _stringValue(
        values['legal.termsOfUseUrl'],
        defaults.termsOfUseUrl,
      ),
      prayerEnabled: _boolValue(
        values['features.prayerEnabled'],
        defaults.prayerEnabled,
      ),
      givingEnabled: _boolValue(
        values['features.givingEnabled'],
        defaults.givingEnabled,
      ),
      memberRegistrationMode: _stringValue(
        values['member.registrationMode'],
        defaults.memberRegistrationMode,
      ),
      memberRequireEmailVerification: _boolValue(
        values['member.requireEmailVerification'],
        defaults.memberRequireEmailVerification,
      ),
      memberRequireAdminApproval: _boolValue(
        values['member.requireAdminApproval'],
        defaults.memberRequireAdminApproval,
      ),
      memberRegistrationHelpText: _stringValue(
        values['member.registrationHelpText'],
        defaults.memberRegistrationHelpText,
      ),
    );
  }

  static const defaults = AppSettings(
    churchName: 'MBCG',
    defaultLocale: 'system',
    prayerEnabled: true,
    givingEnabled: true,
    churchAbout: '',
    churchAddress: '',
    churchMapUrl: '',
    churchContactPhone: '',
    churchContactEmail: '',
    privacyPolicyUrl: '',
    termsOfUseUrl: '',
    memberRegistrationMode: 'open',
    memberRequireEmailVerification: true,
    memberRequireAdminApproval: false,
    memberRegistrationHelpText: '',
  );

  final String churchName;
  final String defaultLocale;
  final bool prayerEnabled;
  final bool givingEnabled;
  final String churchAbout;
  final String churchAddress;
  final String churchMapUrl;
  final String churchContactPhone;
  final String churchContactEmail;
  final String privacyPolicyUrl;
  final String termsOfUseUrl;
  final String memberRegistrationMode;
  final bool memberRequireEmailVerification;
  final bool memberRequireAdminApproval;
  final String memberRegistrationHelpText;

  bool get memberRegistrationOpen => memberRegistrationMode == 'open';
}

String _stringValue(Object? value, String fallback) {
  return value is String && value.trim().isNotEmpty ? value : fallback;
}

bool _boolValue(Object? value, bool fallback) {
  if (value is bool) {
    return value;
  }
  if (value is String) {
    return value == 'true' || value == '1';
  }
  return fallback;
}
