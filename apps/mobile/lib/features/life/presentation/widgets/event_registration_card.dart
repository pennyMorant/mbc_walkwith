import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/life_post.dart';
import 'event_registration_action_buttons.dart';

class EventRegistrationCard extends StatelessWidget {
  const EventRegistrationCard({
    super.key,
    required this.post,
    required this.isSubmitting,
    required this.isSignedIn,
    required this.onSignIn,
    required this.onRegister,
    required this.onUpdate,
    required this.onCancel,
    required this.onCheckIn,
    required this.noteController,
    required this.partySize,
    required this.onPartySizeChanged,
  });

  final LifePost post;
  final bool isSubmitting;
  final bool isSignedIn;
  final VoidCallback onSignIn;
  final VoidCallback? onRegister;
  final VoidCallback? onUpdate;
  final VoidCallback? onCancel;
  final VoidCallback? onCheckIn;
  final TextEditingController noteController;
  final int partySize;
  final ValueChanged<int> onPartySizeChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final summary =
        post.registrationSummary ??
        EventRegistrationSummary(
          enabled: post.registrationEnabled,
          capacity: post.registrationCapacity,
        );
    final isClosed = _isRegistrationClosed(post);
    final isRegistered = summary.isRegistered;
    final isCheckedIn = summary.isCheckedIn;
    final canUpdateRegistration =
        isRegistered &&
        summary.myRegistrationStatus == EventRegistrationStatus.confirmed &&
        !isClosed;
    final capacity = summary.capacity ?? post.registrationCapacity;
    final registeredCount = summary.registeredCount;
    final remainingCount = summary.remainingCount;
    final availableForThisMember = remainingCount == null
        ? null
        : remainingCount + (summary.myPartySize ?? 0);
    final selectableMaxPartySize = availableForThisMember == null
        ? post.registrationMaxPartySize
        : post.registrationMaxPartySize
              .clamp(1, availableForThisMember.clamp(1, 20))
              .toInt();
    final spotsLabel = capacity == null
        ? l10n.eventRegistrationUnlimitedSpots(registeredCount)
        : l10n.eventRegistrationSpots(registeredCount, capacity);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.event_available_outlined,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    l10n.eventRegistrationTitle,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AppChip(label: spotsLabel, icon: Icons.people_outline),
                if (remainingCount != null && !summary.isFull)
                  AppChip(
                    label: l10n.eventRegistrationRemaining(remainingCount),
                    icon: Icons.confirmation_number_outlined,
                  ),
                if (summary.isFull)
                  AppChip(
                    label: l10n.eventRegistrationFull,
                    icon: Icons.block_outlined,
                  ),
                if (isClosed)
                  AppChip(
                    label: l10n.eventRegistrationClosed,
                    icon: Icons.lock_clock_outlined,
                  ),
                if (isRegistered)
                  AppChip(
                    label: isCheckedIn
                        ? l10n.eventRegistrationCheckedIn
                        : l10n.eventRegistrationRegistered,
                    icon: isCheckedIn
                        ? Icons.fact_check_outlined
                        : Icons.check_circle_outline,
                    selected: true,
                  ),
              ],
            ),
            if (summary.myCheckedInAt != null) ...[
              const SizedBox(height: 10),
              Text(
                l10n.eventRegistrationCheckedInAt(
                  _formatCheckInTime(context, summary.myCheckedInAt!),
                ),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
            if (!isSignedIn) ...[
              const SizedBox(height: 12),
              Text(
                l10n.eventRegistrationSignInBody,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            if (isSignedIn &&
                !isClosed &&
                ((!isRegistered && !summary.isFull) ||
                    canUpdateRegistration)) ...[
              const SizedBox(height: 14),
              DropdownButtonFormField<int>(
                initialValue: partySize
                    .clamp(1, selectableMaxPartySize)
                    .toInt(),
                decoration: appFilledInputDecoration(
                  context,
                  hintText: l10n.eventRegistrationPartySizeLabel,
                  prefixIcon: const Icon(Icons.people_outline),
                ),
                items: [
                  for (var size = 1; size <= selectableMaxPartySize; size++)
                    DropdownMenuItem<int>(
                      value: size,
                      child: Text(l10n.eventRegistrationPartySize(size)),
                    ),
                ],
                onChanged: isSubmitting
                    ? null
                    : (value) {
                        if (value != null) {
                          onPartySizeChanged(value);
                        }
                      },
              ),
              const SizedBox(height: 10),
              AppFilledTextField(
                controller: noteController,
                maxLines: 2,
                maxLength: 500,
                enabled: !isSubmitting,
                hintText: l10n.eventRegistrationNoteHint,
                prefixIcon: const Icon(Icons.notes_outlined),
              ),
            ],
            const SizedBox(height: 14),
            Align(
              alignment: Alignment.centerLeft,
              child: EventRegistrationActionButtons(
                isSignedIn: isSignedIn,
                isRegistered: isRegistered,
                isCheckedIn: isCheckedIn,
                isSubmitting: isSubmitting,
                canUpdateRegistration: canUpdateRegistration,
                allowCancellation: post.registrationAllowCancellation,
                registrationClosed: isClosed,
                registrationFull: summary.isFull,
                onSignIn: onSignIn,
                onRegister: onRegister,
                onUpdate: onUpdate,
                onCancel: onCancel,
                onCheckIn: onCheckIn,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

bool _isRegistrationClosed(LifePost post) {
  final deadline = post.registrationDeadline;
  return deadline != null && DateTime.now().isAfter(deadline);
}

String _formatCheckInTime(BuildContext context, DateTime value) =>
    formatDateTime(context, value);
