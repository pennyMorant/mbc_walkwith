import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/life_post.dart';
import '../life_post_detail_presentation.dart';
import 'life_post_card_parts.dart';
import 'life_post_read_state.dart';

class LifeSundayHeroCard extends ConsumerWidget {
  const LifeSundayHeroCard({
    super.key,
    required this.post,
    this.showUnreadBadge = false,
  });

  final LifePost? post;
  final bool showUnreadBadge;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentPost = post;
    if (currentPost == null) {
      return const _EmptySundayHeroCard();
    }
    return _PublishedSundayHeroCard(
      post: currentPost,
      showUnreadBadge: showUnreadBadge,
      onOpen: () => openLifePostDetail(context, ref, currentPost),
    );
  }
}

class _PublishedSundayHeroCard extends StatelessWidget {
  const _PublishedSundayHeroCard({
    required this.post,
    required this.showUnreadBadge,
    required this.onOpen,
  });

  final LifePost post;
  final bool showUnreadBadge;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final readState = LifePostReadState.fromPost(post);
    final scheduleLabel = _sundayScheduleLabel(context, l10n, post);
    final bodyPreview = plainTextPreview(
      post.body,
      maxLength: 150,
      fallback: l10n.lifePostNoBody,
    );

    return Card(
      color: readState.heroCardColor(colorScheme),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onOpen,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  AppChip(label: l10n.weeklyBulletinTitle),
                  AppChip(label: lifePostTypeLabel(l10n, post)),
                  if (showUnreadBadge && readState.isUnread)
                    AppChip(label: l10n.lifePostUnread, selected: true),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                post.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: colorScheme.onSecondaryContainer,
                  fontWeight: readState.emphasisWeight,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                bodyPreview,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: colorScheme.onSecondaryContainer,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Icon(
                    Icons.schedule_outlined,
                    size: 18,
                    color: colorScheme.onSecondaryContainer,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      scheduleLabel,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: colorScheme.onSecondaryContainer,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton.tonalIcon(
                    onPressed: onOpen,
                    icon: const Icon(Icons.arrow_forward),
                    label: Text(l10n.lifeOpenDetailAction),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _sundayScheduleLabel(
  BuildContext context,
  AppLocalizations l10n,
  LifePost post,
) {
  final startsAt = post.startsAt;
  if (startsAt == null) {
    return nonEmptyOrFallback(post.meta, l10n.lifePostScheduleTbd);
  }
  return formatDateRangeByDay(context, startsAt, end: post.endsAt);
}

class _EmptySundayHeroCard extends StatelessWidget {
  const _EmptySundayHeroCard();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      color: colorScheme.secondaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.church_outlined,
              color: colorScheme.onSecondaryContainer,
              size: 32,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.weeklyBulletinTitle,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: colorScheme.onSecondaryContainer,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.lifeSundayHeroEmptyBody,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSecondaryContainer,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
