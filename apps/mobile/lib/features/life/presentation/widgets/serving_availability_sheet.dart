import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_error.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/serving_repository.dart';
import '../../domain/serving_availability.dart';
import '../serving_presenters.dart';
import 'serving_date_time_field.dart';

class ServingAvailabilitySheet extends ConsumerStatefulWidget {
  const ServingAvailabilitySheet({super.key, required this.session});

  final MemberSession session;

  static Future<bool> show(
    BuildContext context, {
    required MemberSession session,
  }) async {
    return await showModalBottomSheet<bool>(
          context: context,
          isScrollControlled: true,
          useSafeArea: true,
          showDragHandle: true,
          builder: (context) => ServingAvailabilitySheet(session: session),
        ) ??
        false;
  }

  @override
  ConsumerState<ServingAvailabilitySheet> createState() =>
      _ServingAvailabilitySheetState();
}

class _ServingAvailabilitySheetState
    extends ConsumerState<ServingAvailabilitySheet> {
  late DateTime _startsAt;
  late DateTime _endsAt;
  final _noteController = TextEditingController();
  String _status = 'available';
  String? _validationError;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _startsAt = DateTime(now.year, now.month, now.day, now.hour + 1);
    _endsAt = _startsAt.add(const Duration(hours: 2));
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        0,
        20,
        MediaQuery.viewInsetsOf(context).bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.servingAvailabilitySheetTitle,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 18),
            ServingFieldLabel(text: l10n.servingAvailabilityStatusLabel),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: appFilledInputDecoration(
                context,
                hintText: l10n.servingAvailabilityStatusLabel,
              ),
              items: const ['available', 'unavailable', 'preferred']
                  .map(
                    (status) => DropdownMenuItem(
                      value: status,
                      child: Text(servingAvailabilityStatusLabel(l10n, status)),
                    ),
                  )
                  .toList(growable: false),
              onChanged: _isSubmitting
                  ? null
                  : (value) {
                      if (value != null) {
                        setState(() => _status = value);
                      }
                    },
            ),
            const SizedBox(height: 14),
            ServingDateTimeField(
              label: l10n.servingAvailabilityStartLabel,
              value: _startsAt,
              icon: Icons.event_outlined,
              enabled: !_isSubmitting,
              onPressed: () => _selectDateTime(isStart: true),
            ),
            const SizedBox(height: 14),
            ServingDateTimeField(
              label: l10n.servingAvailabilityEndLabel,
              value: _endsAt,
              icon: Icons.event_available_outlined,
              enabled: !_isSubmitting,
              onPressed: () => _selectDateTime(isStart: false),
            ),
            const SizedBox(height: 14),
            AppFilledTextField(
              controller: _noteController,
              hintText: l10n.servingAvailabilityNoteHint,
              prefixIcon: const Icon(Icons.notes_outlined),
              maxLines: 3,
              minLines: 2,
              maxLength: 500,
              enabled: !_isSubmitting,
            ),
            if (_validationError != null) ...[
              const SizedBox(height: 8),
              Text(
                _validationError!,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colorScheme.error),
              ),
            ],
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: AppButton(
                label: l10n.servingAvailabilitySaveAction,
                icon: Icons.save_outlined,
                variant: AppButtonVariant.filled,
                loading: _isSubmitting,
                onPressed: _submit,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _selectDateTime({required bool isStart}) async {
    final current = isStart ? _startsAt : _endsAt;
    final value = await selectServingDateTime(context, current: current);
    if (value == null || !mounted) {
      return;
    }
    setState(() {
      if (isStart) {
        final duration = _endsAt.difference(_startsAt);
        _startsAt = value;
        _endsAt = value.add(duration.isNegative ? Duration.zero : duration);
      } else {
        _endsAt = value;
      }
      _validationError = null;
    });
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context)!;
    if (!_endsAt.isAfter(_startsAt)) {
      setState(() {
        _validationError = l10n.servingAvailabilityInvalidRange;
      });
      return;
    }
    setState(() {
      _validationError = null;
      _isSubmitting = true;
    });
    try {
      await ref
          .read(servingRepositoryProvider)
          .createAvailability(
            ServingAvailabilityDraft(
              startsAt: _startsAt,
              endsAt: _endsAt,
              status: _status,
              note: _noteController.text,
            ),
            widget.session,
          );
      ref.invalidate(servingAvailabilityProvider);
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (error) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(formatApiErrorMessage(error))));
      }
    }
  }
}
