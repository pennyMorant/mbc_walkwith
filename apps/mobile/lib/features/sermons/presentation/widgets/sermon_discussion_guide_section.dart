import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_bottom_sheet_scaffold.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../data/sermon_discussion_guide_repository.dart';
import '../../domain/sermon_discussion_guide.dart';
import 'sermon_discussion_guide_parts.dart';
import 'sermon_discussion_response_sheet.dart';

class SermonDiscussionGuideSection extends ConsumerWidget {
  const SermonDiscussionGuideSection({super.key, required this.sermonId});

  final String sermonId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final guideAsync = ref.watch(sermonDiscussionGuideProvider(sermonId));
    return guideAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (error, stackTrace) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: SermonDiscussionGuideLoadError(
          onRetry: () =>
              ref.invalidate(sermonDiscussionGuideProvider(sermonId)),
        ),
      ),
      data: (guide) {
        if (guide == null) {
          return const SizedBox.shrink();
        }
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          child: _GuideCard(guide: guide),
        );
      },
    );
  }
}

class _GuideCard extends ConsumerWidget {
  const _GuideCard({required this.guide});

  final SermonDiscussionGuide guide;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      color: colorScheme.secondaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SermonDiscussionGuideHeader(
              title: guide.title.isEmpty
                  ? l10n.sermonDiscussionTitle
                  : guide.title,
            ),
            if (guide.summary.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                guide.summary.trim(),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSecondaryContainer.withValues(
                    alpha: 0.82,
                  ),
                  height: 1.4,
                ),
              ),
            ],
            if (guide.questions.isNotEmpty) ...[
              const SizedBox(height: 14),
              _QuestionList(questions: guide.questions),
            ],
            if (guide.actionSteps.isNotEmpty) ...[
              const SizedBox(height: 14),
              _ActionStepList(actionSteps: guide.actionSteps),
            ],
            if (guide.prayerPrompts.isNotEmpty) ...[
              const SizedBox(height: 14),
              _PrayerPromptList(prompts: guide.prayerPrompts),
            ],
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: AppButton(
                label: l10n.sermonDiscussionRespondAction,
                icon: Icons.edit_note_outlined,
                variant: AppButtonVariant.filled,
                onPressed: () => unawaited(
                  _openResponseSheet(context: context, guide: guide),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuestionList extends StatelessWidget {
  const _QuestionList({required this.questions});

  final List<SermonDiscussionQuestion> questions;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return SermonDiscussionGuideBlock(
      title: l10n.sermonDiscussionQuestionsTitle,
      children: [
        for (final question in questions)
          SermonDiscussionGuideItem(
            chipLabel: _questionTypeLabel(l10n, question.type),
            title: question.prompt,
          ),
      ],
    );
  }
}

class _ActionStepList extends StatelessWidget {
  const _ActionStepList({required this.actionSteps});

  final List<SermonDiscussionActionStep> actionSteps;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return SermonDiscussionGuideBlock(
      title: l10n.sermonDiscussionActionStepsTitle,
      children: [
        for (final step in actionSteps)
          SermonDiscussionGuideItem(
            chipLabel: l10n.sermonDiscussionActionChip,
            title: step.title,
            body: step.description,
          ),
      ],
    );
  }
}

class _PrayerPromptList extends StatelessWidget {
  const _PrayerPromptList({required this.prompts});

  final List<String> prompts;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return SermonDiscussionGuideBlock(
      title: l10n.sermonDiscussionPrayerTitle,
      children: [
        for (final prompt in prompts)
          SermonDiscussionGuideItem(
            chipLabel: l10n.sermonDiscussionPrayerChip,
            title: prompt,
          ),
      ],
    );
  }
}

Future<void> _openResponseSheet({
  required BuildContext context,
  required SermonDiscussionGuide guide,
}) async {
  final saved = await showAppBottomSheet<bool>(
    context: context,
    builder: (context) => SermonDiscussionResponseSheet(guide: guide),
  );
  if (saved != true || !context.mounted) {
    return;
  }
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(AppLocalizations.of(context)!.sermonDiscussionSubmitted),
    ),
  );
}

String _questionTypeLabel(AppLocalizations l10n, String type) {
  return switch (type) {
    'observation' => l10n.sermonDiscussionObservationChip,
    'interpretation' => l10n.sermonDiscussionInterpretationChip,
    'application' => l10n.sermonDiscussionApplicationChip,
    'prayer' => l10n.sermonDiscussionPrayerChip,
    'action' => l10n.sermonDiscussionActionChip,
    _ => type,
  };
}
