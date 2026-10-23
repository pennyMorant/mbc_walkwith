import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/app_routes.dart';
import '../../../../core/settings/app_settings.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../life/domain/course_learning.dart';
import '../../../life/domain/ministry_group.dart';
import '../../../life/domain/serving_assignment.dart';
import '../../../member_auth/data/member_session_repository.dart';
import 'member_guest_session_content.dart';

class MemberSessionCard extends StatelessWidget {
  const MemberSessionCard({
    super.key,
    required this.session,
    required this.settings,
    required this.groupsAsync,
    required this.coursesAsync,
    required this.servingAsync,
  });

  final MemberSession? session;
  final AppSettings settings;
  final AsyncValue<List<MinistryGroup>> groupsAsync;
  final AsyncValue<List<CourseLearning>> coursesAsync;
  final AsyncValue<List<ServingAssignment>> servingAsync;

  @override
  Widget build(BuildContext context) {
    final currentSession = session;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: currentSession == null
            ? null
            : () => context.pushNamed(AppRouteNames.memberProfile),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: currentSession == null
              ? MemberGuestSessionContent(settings: settings)
              : _MemberContent(
                  session: currentSession,
                  groupsAsync: groupsAsync,
                  coursesAsync: coursesAsync,
                  servingAsync: servingAsync,
                ),
        ),
      ),
    );
  }
}

class _MemberContent extends StatelessWidget {
  const _MemberContent({
    required this.session,
    required this.groupsAsync,
    required this.coursesAsync,
    required this.servingAsync,
  });

  final MemberSession session;
  final AsyncValue<List<MinistryGroup>> groupsAsync;
  final AsyncValue<List<CourseLearning>> coursesAsync;
  final AsyncValue<List<ServingAssignment>> servingAsync;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final memberGroup = _memberGroup(session.member, groupsAsync);
    final enrolledCourses = _myCourseCount(coursesAsync);
    final servingCount = _servingCount(servingAsync);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              child: Text(_memberInitial(session.member.displayName)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session.member.displayName,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  Text(
                    session.member.email,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            AppChip(
              label: session.member.status,
              icon: Icons.verified_user_outlined,
              variant: AppChipVariant.filled,
              backgroundColor: colorScheme.primaryContainer,
              foregroundColor: colorScheme.onPrimaryContainer,
            ),
            for (final role in session.member.roles)
              AppChip(label: role, variant: AppChipVariant.filled),
            _ChipAction(
              tooltip: l10n.groupMyGroupsTitle,
              onPressed: () => context.pushNamed(AppRouteNames.myGroups),
              child: AppChip(
                label: memberGroup ?? l10n.memberNoGroupLabel,
                icon: Icons.groups_outlined,
                variant: AppChipVariant.filled,
              ),
            ),
            _ChipAction(
              tooltip: l10n.courseMyCoursesTitle,
              onPressed: () => context.pushNamed(AppRouteNames.myCourses),
              child: AppChip(
                label: l10n.mineLifeCoursesCountLabel(enrolledCourses),
                icon: Icons.school_outlined,
                variant: AppChipVariant.filled,
              ),
            ),
            _ChipAction(
              tooltip: l10n.servingTitle,
              onPressed: () => context.pushNamed(AppRouteNames.myServing),
              child: AppChip(
                label: l10n.mineLifeServingCountLabel(servingCount),
                icon: Icons.event_available_outlined,
                variant: AppChipVariant.filled,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ChipAction extends StatelessWidget {
  const _ChipAction({
    required this.tooltip,
    required this.onPressed,
    required this.child,
  });

  final String tooltip;
  final VoidCallback onPressed;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Semantics(
        button: true,
        label: tooltip,
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: onPressed,
          child: child,
        ),
      ),
    );
  }
}

String? _memberGroup(
  MemberProfile member,
  AsyncValue<List<MinistryGroup>> groupsAsync,
) {
  final groups = groupsAsync.maybeWhen(
    data: (groups) => groups,
    orElse: () => const <MinistryGroup>[],
  );
  final direct = groups.where((group) => group.id == member.fellowshipGroupId);
  if (direct.isNotEmpty) {
    return direct.first.name;
  }
  final active = groups.where((group) => group.isMember);
  return active.isEmpty ? member.fellowshipGroupId : active.first.name;
}

int _myCourseCount(AsyncValue<List<CourseLearning>> coursesAsync) {
  return coursesAsync
      .maybeWhen(
        data: (courses) => courses,
        orElse: () => const <CourseLearning>[],
      )
      .where((course) => course.myEnrollmentStatus != 'cancelled')
      .length;
}

int _servingCount(AsyncValue<List<ServingAssignment>> servingAsync) {
  return servingAsync
      .maybeWhen(
        data: (items) => items,
        orElse: () => const <ServingAssignment>[],
      )
      .length;
}

String _memberInitial(String displayName) {
  final cleanName = displayName.trim();
  if (cleanName.isEmpty) {
    return 'M';
  }
  return String.fromCharCode(cleanName.runes.first);
}
