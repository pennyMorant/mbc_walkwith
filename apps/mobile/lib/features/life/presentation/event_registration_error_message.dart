import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';

String eventRegistrationErrorMessage(AppLocalizations l10n, Object error) {
  if (error is! ApiError) {
    return l10n.eventRegistrationUnavailable;
  }
  return switch (error.code) {
    'event_not_found' => l10n.eventRegistrationUnavailable,
    'event_capacity_full' => l10n.eventRegistrationFull,
    'event_not_open' => l10n.eventRegistrationClosed,
    'event_party_size_invalid' => l10n.eventRegistrationPartySizeInvalid,
    'registration_not_found' => l10n.eventRegistrationNotFound,
    'check_in_not_allowed' => l10n.eventRegistrationCheckInLocked,
    'authentication_required' ||
    'auth_required' => l10n.eventRegistrationSignInBody,
    _ => l10n.eventRegistrationUnavailable,
  };
}
