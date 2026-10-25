import '../../../l10n/app_localizations.dart';

String memberStatusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'active' => l10n.memberStatusActive,
    'inactive' => l10n.memberStatusInactive,
    'pending' => l10n.memberStatusPending,
    'blocked' => l10n.memberStatusBlocked,
    _ => status,
  };
}

String memberRoleLabel(AppLocalizations l10n, String role) {
  return switch (role) {
    'member' => l10n.memberRoleMember,
    'leader' => l10n.memberRoleLeader,
    'pastor' => l10n.memberRolePastor,
    _ => role,
  };
}
