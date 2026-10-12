import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/filled_text_field.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../life/presentation/push_notifications_controller.dart';
import '../../member_auth/data/member_session_repository.dart';

class MemberProfilePage extends ConsumerStatefulWidget {
  const MemberProfilePage({super.key});

  @override
  ConsumerState<MemberProfilePage> createState() => _MemberProfilePageState();
}

class _MemberProfilePageState extends ConsumerState<MemberProfilePage> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _faithYearController = TextEditingController();
  final _baptizedYearController = TextEditingController();
  final _joinedChurchController = TextEditingController();
  final _emergencyNameController = TextEditingController();
  final _emergencyPhoneController = TextEditingController();
  String? _loadedMemberId;
  bool _isSaving = false;
  bool _isSigningOut = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _faithYearController.dispose();
    _baptizedYearController.dispose();
    _joinedChurchController.dispose();
    _emergencyNameController.dispose();
    _emergencyPhoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = ref
        .watch(memberSessionProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);
    if (session == null) {
      return Scaffold(
        appBar: SecondaryAppBar(title: l10n.memberProfileTitle),
        body: Center(child: Text(l10n.memberOptionalSignInTitle)),
      );
    }
    _syncControllers(session.member);
    final member = session.member;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: SecondaryAppBar(
        title: l10n.memberProfileTitle,
        onBack: () => context.pop(),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: IconButton.filledTonal(
              tooltip: l10n.memberSignOutAction,
              onPressed: _isSaving || _isSigningOut
                  ? null
                  : () => _logout(session),
              icon: _isSigningOut
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: colorScheme.primary,
                      ),
                    )
                  : const Icon(Icons.logout),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.memberProfileEditTitle,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 14),
                  _ReadOnlyRow(
                    label: l10n.memberEmailLabel,
                    value: member.email,
                  ),
                  _ReadOnlyRow(
                    label: l10n.memberStatusLabel,
                    value: member.status,
                  ),
                  _ReadOnlyRow(
                    label: l10n.memberGroupLabel,
                    value: member.fellowshipGroupId ?? l10n.memberNoGroupLabel,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  AppFilledTextField(
                    controller: _nameController,
                    textInputAction: TextInputAction.next,
                    hintText: l10n.memberNameLabel,
                    prefixIcon: const Icon(Icons.person_outline),
                  ),
                  const SizedBox(height: 12),
                  AppFilledTextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    hintText: l10n.memberPhoneLabel,
                    prefixIcon: const Icon(Icons.phone_outlined),
                  ),
                  const SizedBox(height: 12),
                  AppFilledTextField(
                    controller: _addressController,
                    textInputAction: TextInputAction.next,
                    hintText: l10n.memberAddressLabel,
                    prefixIcon: const Icon(Icons.home_outlined),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: AppFilledTextField(
                          controller: _faithYearController,
                          keyboardType: TextInputType.number,
                          textInputAction: TextInputAction.next,
                          hintText: l10n.memberFaithStartYearLabel,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: AppFilledTextField(
                          controller: _baptizedYearController,
                          keyboardType: TextInputType.number,
                          textInputAction: TextInputAction.next,
                          hintText: l10n.memberBaptizedYearLabel,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  AppFilledTextField(
                    controller: _joinedChurchController,
                    keyboardType: TextInputType.datetime,
                    textInputAction: TextInputAction.next,
                    hintText: l10n.memberJoinedChurchAtLabel,
                    helperText: 'YYYY-MM-DD',
                    prefixIcon: const Icon(Icons.event_outlined),
                  ),
                  const SizedBox(height: 12),
                  AppFilledTextField(
                    controller: _emergencyNameController,
                    textInputAction: TextInputAction.next,
                    hintText: l10n.memberEmergencyContactNameLabel,
                    prefixIcon: const Icon(Icons.contact_emergency_outlined),
                  ),
                  const SizedBox(height: 12),
                  AppFilledTextField(
                    controller: _emergencyPhoneController,
                    keyboardType: TextInputType.phone,
                    hintText: l10n.memberEmergencyContactPhoneLabel,
                    prefixIcon: const Icon(Icons.phone_in_talk_outlined),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colorScheme.error,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _isSaving || _isSigningOut ? null : () => _save(session),
            icon: const Icon(Icons.save_outlined),
            label: Text(l10n.memberProfileSaveAction),
          ),
        ],
      ),
    );
  }

  void _syncControllers(MemberProfile member) {
    if (_loadedMemberId == member.id) {
      return;
    }
    _loadedMemberId = member.id;
    _nameController.text = member.displayName;
    _phoneController.text = member.phone ?? '';
    _addressController.text = member.address ?? '';
    _faithYearController.text = member.faithStartYear?.toString() ?? '';
    _baptizedYearController.text = member.baptizedYear?.toString() ?? '';
    _joinedChurchController.text = member.joinedChurchAt ?? '';
    _emergencyNameController.text = member.emergencyContactName ?? '';
    _emergencyPhoneController.text = member.emergencyContactPhone ?? '';
  }

  Future<void> _save(MemberSession session) async {
    setState(() {
      _isSaving = true;
      _error = null;
    });
    try {
      await ref
          .read(memberSessionRepositoryProvider)
          .updateProfile(
            session,
            displayName: _nameController.text,
            phone: _phoneController.text,
            address: _addressController.text,
            faithStartYear: _intFromText(_faithYearController.text),
            baptizedYear: _intFromText(_baptizedYearController.text),
            joinedChurchAt: _joinedChurchController.text,
            emergencyContactName: _emergencyNameController.text,
            emergencyContactPhone: _emergencyPhoneController.text,
          );
      ref.invalidate(memberSessionProvider);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.memberProfileSaved),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _error = formatApiErrorMessage(error));
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<void> _logout(MemberSession session) async {
    setState(() {
      _isSigningOut = true;
      _error = null;
    });
    try {
      await ref
          .read(pushNotificationsControllerProvider.notifier)
          .revokeCurrentDevice(session);
      await ref.read(memberSessionRepositoryProvider).logout(session);
      ref.invalidate(memberSessionProvider);
      await _syncPushRegistrationBestEffort();
      if (mounted && context.canPop()) {
        context.pop();
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _error = formatApiErrorMessage(error));
    } finally {
      if (mounted) {
        setState(() => _isSigningOut = false);
      }
    }
  }

  Future<void> _syncPushRegistrationBestEffort() async {
    try {
      await ref
          .read(pushNotificationsControllerProvider.notifier)
          .syncCurrentSession();
    } catch (_) {
      // Sign-out must not be blocked by a notification registration failure.
    }
  }
}

class _ReadOnlyRow extends StatelessWidget {
  const _ReadOnlyRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 112,
            child: Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

int? _intFromText(String value) {
  final clean = value.trim();
  return clean.isEmpty ? null : int.tryParse(clean);
}
