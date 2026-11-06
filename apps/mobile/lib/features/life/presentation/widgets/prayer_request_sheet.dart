import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_bottom_sheet_scaffold.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/prayer_repository.dart';
import '../life_action_error_message.dart';

class PrayerRequestSheet extends ConsumerStatefulWidget {
  const PrayerRequestSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => const PrayerRequestSheet(),
    );
  }

  @override
  ConsumerState<PrayerRequestSheet> createState() => _PrayerRequestSheetState();
}

class _PrayerRequestSheetState extends ConsumerState<PrayerRequestSheet> {
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  final _nameController = TextEditingController();
  String _visibility = 'private';
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    _nameController.dispose();
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
            l10n.prayerSubmitTitle,
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          Text(
            session == null
                ? l10n.prayerGuestSubmitBody
                : l10n.prayerMemberSubmitBody,
            style: Theme.of(context).textTheme.bodyMedium
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 18),
          AppFilledTextField(
            controller: _titleController,
            enabled: !_isSubmitting,
            textInputAction: TextInputAction.next,
            hintText: l10n.prayerTitleLabel,
          ),
          const SizedBox(height: 10),
          AppFilledTextField(
            controller: _bodyController,
            enabled: !_isSubmitting,
            minLines: 4,
            maxLines: 7,
            textInputAction: TextInputAction.newline,
            hintText: l10n.prayerBodyLabel,
          ),
          if (session == null) ...[
            const SizedBox(height: 10),
            AppFilledTextField(
              controller: _nameController,
              enabled: !_isSubmitting,
              textInputAction: TextInputAction.done,
              hintText: l10n.prayerNameLabel,
            ),
          ],
          const SizedBox(height: 14),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(
                value: 'private',
                icon: const Icon(Icons.lock_outline),
                label: Text(l10n.prayerVisibilityPrivate),
              ),
              if (session != null)
                ButtonSegment(
                  value: 'members',
                  icon: const Icon(Icons.groups_outlined),
                  label: Text(l10n.prayerVisibilityMembers),
                ),
            ],
            selected: {_visibility},
            onSelectionChanged: _isSubmitting
                ? null
                : (values) {
                    setState(() {
                      _visibility = values.first;
                    });
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
              label: l10n.prayerSubmitAction,
              icon: Icons.send_outlined,
              variant: AppButtonVariant.filled,
              loading: _isSubmitting,
              onPressed: _submit,
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
      setState(() {
        _error = l10n.prayerValidationError;
      });
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
      await ref
          .read(prayerRepositoryProvider)
          .submitRequest(
            title: title,
            body: body,
            visibility: _visibility,
            submitterName: session == null ? _nameController.text.trim() : null,
            session: session,
          );
      ref.invalidate(publicPrayerRequestsProvider);
      ref.invalidate(memberPrayerRequestsProvider);
      if (mounted) {
        navigator.pop();
        messenger.showSnackBar(
          SnackBar(content: Text(l10n.prayerSubmittedMessage)),
        );
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = lifeActionErrorMessage(
            error,
            fallback: l10n.lifeActionError,
          );
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }
}
