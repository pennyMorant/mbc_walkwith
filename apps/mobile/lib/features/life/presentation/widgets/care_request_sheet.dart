import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_error.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_bottom_sheet_scaffold.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/care_repository.dart';
import '../life_action_error_message.dart';

class CareRequestSheet extends ConsumerStatefulWidget {
  const CareRequestSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => const CareRequestSheet(),
    );
  }

  @override
  ConsumerState<CareRequestSheet> createState() => _CareRequestSheetState();
}

class _CareRequestSheetState extends ConsumerState<CareRequestSheet> {
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  String _privacyLevel = 'pastoral_only';
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final session = ref
        .watch(memberSessionProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);

    return AppBottomSheetScaffold(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.careSubmitTitle,
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          Text(
            session == null ? l10n.careSignInRequired : l10n.careSubmitBody,
            style: Theme.of(context).textTheme.bodyMedium
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 18),
          AppFilledTextField(
            controller: _titleController,
            enabled: session != null && !_isSubmitting,
            textInputAction: TextInputAction.next,
            hintText: l10n.careTitleLabel,
          ),
          const SizedBox(height: 10),
          AppFilledTextField(
            controller: _bodyController,
            enabled: session != null && !_isSubmitting,
            minLines: 4,
            maxLines: 7,
            textInputAction: TextInputAction.newline,
            hintText: l10n.careBodyLabel,
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            isExpanded: true,
            initialValue: _privacyLevel,
            decoration: appFilledInputDecoration(
              context,
              hintText: l10n.carePrivacyLabel,
            ),
            items: [
              DropdownMenuItem(
                value: 'pastoral_only',
                child: Text(l10n.carePrivacyPastoralOnly),
              ),
              DropdownMenuItem(
                value: 'assigned_team',
                child: Text(l10n.carePrivacyAssignedTeam),
              ),
              DropdownMenuItem(
                value: 'admin_restricted',
                child: Text(l10n.carePrivacyAdminRestricted),
              ),
            ],
            onChanged: session == null || _isSubmitting
                ? null
                : (value) {
                    if (value != null) {
                      setState(() => _privacyLevel = value);
                    }
                  },
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
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: AppButton(
              label: l10n.careSubmitAction,
              icon: Icons.send_outlined,
              variant: AppButtonVariant.filled,
              loading: _isSubmitting,
              onPressed: session == null ? null : _submit,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (_isSubmitting) {
      return;
    }
    final l10n = AppLocalizations.of(context)!;
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final title = _titleController.text.trim();
    final body = _bodyController.text.trim();
    if (title.isEmpty || body.isEmpty) {
      setState(() => _error = l10n.careValidationError);
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      final session = ref
          .read(memberSessionProvider)
          .maybeWhen(data: (session) => session, orElse: () => null);
      if (session == null) {
        throw ApiError(message: l10n.careSignInRequired);
      }
      await ref
          .read(careRepositoryProvider)
          .submitRequest(
            session: session,
            title: title,
            body: body,
            privacyLevel: _privacyLevel,
          );
      ref.invalidate(careRequestsProvider);
      if (mounted) {
        navigator.pop();
        messenger.showSnackBar(
          SnackBar(content: Text(l10n.careSubmittedMessage)),
        );
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = lifeActionErrorMessage(
            error,
            fallback: l10n.lifeActionError,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}
