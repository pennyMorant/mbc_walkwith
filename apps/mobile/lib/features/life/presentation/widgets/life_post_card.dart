import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/platform/external_link_service.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/life_post.dart';
import 'life_post_card_parts.dart';
import 'life_post_image_fallback.dart';
import 'life_post_read_state.dart';

class LifePostCard extends ConsumerWidget {
  const LifePostCard({
    super.key,
    required this.post,
    this.onTap,
    this.compactBody = false,
    this.showRegistrationDetails = false,
    this.showUnreadBadge = false,
  });

  final LifePost post;
  final VoidCallback? onTap;
  final bool compactBody;
  final bool showRegistrationDetails;
  final bool showUnreadBadge;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final readState = LifePostReadState.fromPost(post);
    final shouldShowSchedule = lifePostShouldShowScheduleInCard(post);
    final visibilityLabel = lifePostVisibilityLabel(l10n, post.visibility);
    final bodyPreview = plainTextPreview(
      post.body,
      maxLength: compactBody ? 130 : 240,
      fallback: l10n.lifePostNoBody,
    );

    return Card(
      color: readState.cardColor(colorScheme),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (post.imageUrl != null && post.imageUrl!.isNotEmpty) ...[
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      post.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return LifePostImageFallback(
                          post: post,
                          showTitle: true,
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 14),
              ],
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  AppChip(label: lifePostTypeLabel(l10n, post)),
                  if (showUnreadBadge && readState.isUnread)
                    AppChip(label: l10n.lifePostUnread, selected: true),
                  if (visibilityLabel != null)
                    AppChip(label: visibilityLabel, icon: Icons.lock_outline),
                  if (post.registrationEnabled)
                    AppChip(
                      label: lifePostRegistrationLabel(l10n, post),
                      icon: Icons.event_available_outlined,
                      selected: post.registrationSummary?.isRegistered ?? false,
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                post.title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: readState.titleWeight,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                bodyPreview,
                maxLines: compactBody ? 2 : null,
                overflow: compactBody ? TextOverflow.ellipsis : null,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: readState.bodyColor(colorScheme),
                ),
              ),
              if (shouldShowSchedule) ...[
                const SizedBox(height: 10),
                Text(
                  lifePostScheduleLabel(context, l10n, post),
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: readState.bodyColor(colorScheme),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
              if (showRegistrationDetails &&
                  lifePostHasRegistrationDetails(post)) ...[
                const SizedBox(height: 10),
                LifePostRegistrationDetails(post: post),
              ],
              if (lifePostHasAction(post)) ...[
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerLeft,
                  child: FilledButton.icon(
                    onPressed: () => openLifePostActionUrl(
                      post,
                      ref.read(externalLinkServiceProvider),
                    ),
                    icon: const Icon(Icons.open_in_new),
                    label: Text(lifePostActionLabel(l10n, post)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
