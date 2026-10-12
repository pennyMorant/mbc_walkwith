import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';

String eventCheckInErrorMessage(AppLocalizations l10n, Object error) {
  if (error is! ApiError) {
    return l10n.eventRegistrationUnavailable;
  }
  return switch (error.code) {
    'event_check_in_code_invalid' => l10n.eventCheckInQrInvalid,
    'event_check_in_code_expired' => l10n.eventCheckInQrExpired,
    'event_check_in_code_disabled' => l10n.eventCheckInQrDisabled,
    'registration_not_found' => l10n.eventCheckInQrRegistrationRequired,
    'event_not_found' => l10n.eventRegistrationUnavailable,
    'event_not_open' => l10n.eventRegistrationClosed,
    'authentication_required' ||
    'auth_required' => l10n.eventRegistrationSignInBody,
    _ => error.message,
  };
}
