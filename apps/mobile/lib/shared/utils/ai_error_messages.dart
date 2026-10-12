import '../../core/api/api_error.dart';
import '../../l10n/app_localizations.dart';

String aiUserFacingErrorMessage(AppLocalizations l10n, Object error) {
  if (error is ApiError) {
    if (error.hasCode({'ai_provider_disabled', 'ai_provider_misconfigured'})) {
      return l10n.aiStudyProviderDisabled;
    }
    if (error.hasCode({'ai_rate_limited'})) {
      return l10n.aiStudyRateLimited;
    }
    if (error.isAuthenticationRequired) {
      return l10n.aiStudySignInBody;
    }
    if (error.isCapabilityFailure) {
      return l10n.aiStudyProviderFailed;
    }
    return error.message;
  }
  return l10n.aiStudyProviderFailed;
}
