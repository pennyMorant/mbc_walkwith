import 'package:flutter/material.dart';

import '../../../../core/platform/external_link_service.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/life_post.dart';
import 'life_post_classification.dart';

class LifePostRegistrationDetails extends StatelessWidget {
  const LifePostRegistrationDetails({super.key, required this.post});

  final LifePost post;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final summary = post.registrationSummary;
    final partySize = summary?.myPartySize;
    final note = summary?.myNote?.trim();
    final details = [
      if (partySize != null) l10n.eventRegistrationPartySize(partySize),
      if (note != null && note.isNotEmpty) note,
    ].join(' · ');

    return Align(
      alignment: Alignment.centerLeft,
      child: AppChip(
        icon: Icons.how_to_reg_outlined,
        label: details,
        selected: true,
      ),
    );
  }
}

String lifePostScheduleLabel(
  BuildContext context,
  AppLocalizations l10n,
  LifePost post,
) {
  if (post.startsAt == null) {
    return post.meta.isEmpty ? l10n.lifePostScheduleTbd : post.meta;
  }

  final startsAt = post.startsAt!;
  final startLabel = formatDateTime(context, startsAt);

  if (post.endsAt == null) {
    return startLabel;
  }

  final endsAt = post.endsAt!;
  final sameDay =
      startsAt.year == endsAt.year &&
      startsAt.month == endsAt.month &&
      startsAt.day == endsAt.day;

  if (sameDay) {
    return '$startLabel-${formatTimeOnly(context, endsAt)}';
  }

  return '$startLabel-${formatDateTime(context, endsAt)}';
}

bool lifePostShouldShowScheduleInCard(LifePost post) {
  final hasScheduleText = post.startsAt != null || post.meta.trim().isNotEmpty;
  if (!hasScheduleText) {
    return false;
  }
  return lifePostIsEventLike(post) ||
      lifePostIsCourseLike(post) ||
      lifePostIsServingLike(post);
}

String? lifePostVisibilityLabel(AppLocalizations l10n, String visibility) {
  return switch (visibility) {
    'public' => null,
    'members' => l10n.lifePostVisibilityMembers,
    'group' => l10n.lifePostVisibilityGroup,
    'private' => l10n.lifePostVisibilityPrivate,
    _ => l10n.commonVisibilityUnknownLabel,
  };
}

String lifePostTypeLabel(AppLocalizations l10n, LifePost post) {
  final type = _normalized(post.type);
  return switch (type) {
    'weekly_bulletin' || 'bulletin' => l10n.lifePostTypeWeeklyBulletin,
    'sunday' || 'worship' => l10n.lifePostTypeSunday,
    'announcement' || 'news' => l10n.lifePostTypeAnnouncement,
    'event' || 'activity' => l10n.lifePostTypeEvent,
    'group' || 'cell' || '小组' || '小組' => l10n.lifePostTypeGroup,
    'fellowship' || '团契' || '團契' => l10n.lifePostTypeFellowship,
    'course' || 'class' || 'lesson' => l10n.lifePostTypeCourse,
    'serving' ||
    'service_opportunity' ||
    'ministry' ||
    'volunteer' => l10n.lifePostTypeServing,
    'prayer' || 'care' => l10n.lifePostTypePrayer,
    'giving' => l10n.lifePostTypeGiving,
    _ when lifePostIsCourseLike(post) => l10n.lifePostTypeCourse,
    _ when lifePostIsServingLike(post) => l10n.lifePostTypeServing,
    _ when lifePostIsPrayerLike(post) => l10n.lifePostTypePrayer,
    _ when lifePostIsGroupLike(post) => l10n.lifePostTypeGroup,
    _ when lifePostIsEventLike(post) => l10n.lifePostTypeEvent,
    _ => post.type.trim().isEmpty ? l10n.lifePostTypeAnnouncement : post.type,
  };
}

String lifePostRegistrationLabel(AppLocalizations l10n, LifePost post) {
  final summary = post.registrationSummary;
  final registeredCount = summary?.registeredCount ?? 0;
  final capacity = summary?.capacity ?? post.registrationCapacity;
  if (capacity == null) {
    return l10n.eventRegistrationUnlimitedSpots(registeredCount);
  }
  return l10n.eventRegistrationSpots(registeredCount, capacity);
}

bool lifePostHasAction(LifePost post) {
  final label = post.ctaLabel?.trim();
  final url = post.ctaUrl?.trim();
  return label != null && label.isNotEmpty && url != null && url.isNotEmpty;
}

bool lifePostHasRegistrationDetails(LifePost post) {
  final summary = post.registrationSummary;
  if (summary == null || !summary.isRegistered) {
    return false;
  }
  final note = summary.myNote?.trim();
  return summary.myPartySize != null || (note != null && note.isNotEmpty);
}

String lifePostActionLabel(AppLocalizations l10n, LifePost post) {
  final label = post.ctaLabel?.trim();
  return label == null || label.isEmpty ? l10n.lifePostActionOpen : label;
}

Future<void> openLifePostActionUrl(
  LifePost post,
  ExternalLinkService linkService,
) async {
  await linkService.openExternalUrl(post.ctaUrl);
}

String _normalized(String value) {
  return value.trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
}
