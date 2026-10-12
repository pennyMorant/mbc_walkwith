import '../../../l10n/app_localizations.dart';

String servingAssignmentStatusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'scheduled' => l10n.servingStatusScheduled,
    'confirmed' => l10n.servingStatusConfirmed,
    'declined' => l10n.servingStatusDeclined,
    'swap_requested' => l10n.servingStatusSwapRequested,
    'covered' => l10n.servingStatusCovered,
    'cancelled' => l10n.servingStatusCancelled,
    _ => l10n.commonStatusUnknownLabel,
  };
}

String servingAvailabilityStatusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'available' => l10n.servingAvailabilityStatusAvailable,
    'unavailable' => l10n.servingAvailabilityStatusUnavailable,
    'preferred' => l10n.servingAvailabilityStatusPreferred,
    _ => l10n.commonStatusUnknownLabel,
  };
}

String servingCheckInStatusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'pending' => l10n.servingCheckInStatusPending,
    'checked_in' => l10n.servingCheckInStatusCheckedIn,
    'missed' => l10n.servingCheckInStatusMissed,
    _ => l10n.commonStatusUnknownLabel,
  };
}
