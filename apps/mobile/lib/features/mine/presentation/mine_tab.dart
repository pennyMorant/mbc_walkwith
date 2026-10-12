import 'dart:async';

import 'package:app_settings/app_settings.dart' as device_settings;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/config/app_version.dart';
import '../../../core/platform/external_link_service.dart';
import '../../../core/settings/app_settings.dart';
import '../../../core/settings/app_settings_repository.dart';
import '../../../core/settings/app_text_scale_provider.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_chip.dart';
import '../../../theme/app_colors.dart';
import '../../../theme/theme_provider.dart';
import '../../discipleship/presentation/widgets/mine_discipleship_card.dart';
import '../../life/data/course_repository.dart';
import '../../life/data/group_repository.dart';
import '../../life/data/serving_repository.dart';
import '../../life/domain/course_learning.dart';
import '../../life/domain/ministry_group.dart';
import '../../life/domain/serving_assignment.dart';
import '../../life/presentation/push_notifications_controller.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../../shell/widgets/shell_app_bar.dart';
import '../../study/domain/bible_translation.dart';
import '../../study/presentation/reader_assist_settings_provider.dart';
import 'widgets/about_church_card.dart';
import 'widgets/mine_giving_card.dart';
import 'widgets/mine_reading_plan_card.dart';
import 'widgets/preference_settings_card.dart';

class MineTab extends ConsumerWidget {
  const MineTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context);
    final translation = BibleTranslation.fromLocale(locale);
    final themeMode = ref.watch(themeModeProvider);
    final textScale = ref.watch(appTextScaleProvider);
    final readerAssistSettings = ref.watch(readerAssistSettingsProvider);
    final pushState = ref.watch(pushNotificationsControllerProvider);
    final memberSessionAsync = ref.watch(memberSessionProvider);
    final memberSession = memberSessionAsync.maybeWhen(
      data: (session) => session,
      orElse: () => null,
    );
    final settings = ref
        .watch(appSettingsProvider)
        .maybeWhen(
          data: (settings) => settings,
          orElse: () => AppSettings.defaults,
        );
    final groupsAsync = ref.watch(myMinistryGroupsProvider);
    final coursesAsync = ref.watch(myCoursesProvider);
    final servingAsync = ref.watch(servingAssignmentsProvider);

    return Scaffold(
      appBar: ShellAppBar(title: l10n.mineTitle),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        children: [
          MemberSessionCard(
            session: memberSession,
            settings: settings,
            groupsAsync: groupsAsync,
            coursesAsync: coursesAsync,
            servingAsync: servingAsync,
          ),
          const MineReadingPlanCard(),
          if (memberSession != null) ...[
            const SizedBox(height: 12),
            const MineDiscipleshipCard(),
          ],
          const SizedBox(height: 12),
          PreferenceSettingsCard(
            themeMode: themeMode,
            onThemeModeChanged: (mode) {
              ref.read(themeModeProvider.notifier).updateThemeMode(mode);
            },
            textScale: textScale,
            onTextScaleChanged: (scale) {
              ref.read(appTextScaleProvider.notifier).update(scale);
            },
            locale: locale,
            translation: translation,
            onOpenLanguageSettings: _openLanguageSettings,
            pushState: pushState,
            onNotificationPermissionPressed: () {
              final controller = ref.read(
                pushNotificationsControllerProvider.notifier,
              );
              if (pushState.permissionGranted) {
                unawaited(
                  controller.openSystemNotificationSettingsAndRefresh(),
                );
              } else {
                unawaited(controller.requestPermissionAndSync());
              }
            },
            readerAssistSettings: readerAssistSettings,
            onChapterPeopleChanged: ref
                .read(readerAssistSettingsProvider.notifier)
                .updateChapterPeople,
            onChapterPlacesChanged: ref
                .read(readerAssistSettingsProvider.notifier)
                .updateChapterPlaces,
            onLexiconChanged: ref
                .read(readerAssistSettingsProvider.notifier)
                .updateLexicon,
          ),
          if (settings.givingEnabled) ...[
            const SizedBox(height: 12),
            const MineGivingCard(),
          ],
          const SizedBox(height: 12),
          AboutChurchCard(
            settings: settings,
            appVersion: AppVersion.display,
            onOpenUrl: (url) {
              unawaited(
                ref.read(externalLinkServiceProvider).openExternalUrl(url),
              );
            },
            onOpenUri: (uri) {
              unawaited(
                ref.read(externalLinkServiceProvider).openExternalUri(uri),
              );
            },
          ),
        ],
      ),
    );
  }

  Future<void> _openLanguageSettings() async {
    await device_settings.AppSettings.openAppSettings(
      type: defaultTargetPlatform == TargetPlatform.android
          ? device_settings.AppSettingsType.appLocale
          : device_settings.AppSettingsType.settings,
    );
  }
}

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
    final colorScheme = Theme.of(context).colorScheme;
    final currentSession = session;

    return Material(
      color: colorScheme.tintedCardColor,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: currentSession == null
            ? null
            : () => context.pushNamed(AppRouteNames.memberProfile),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: currentSession == null
              ? _buildGuest(context)
              : _buildMember(context, currentSession),
        ),
      ),
    );
  }

  Widget _buildGuest(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.memberOptionalSignInTitle,
          style: Theme.of(context).textTheme.titleMedium
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        Text(
          l10n.memberOptionalSignInBody,
          style: Theme.of(context).textTheme.bodyMedium
              ?.copyWith(color: colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 14),
        if (settings.memberRegistrationHelpText.trim().isNotEmpty) ...[
          Text(
            settings.memberRegistrationHelpText,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
        ],
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            FilledButton.icon(
              onPressed: () =>
                  context.pushNamed(AppRouteNames.memberLoginEmail),
              icon: const Icon(Icons.login),
              label: Text(l10n.memberSignInAction),
            ),
          ],
        ),
        if (!settings.memberRegistrationOpen) ...[
          const SizedBox(height: 10),
          Text(
            l10n.memberRegistrationClosed,
            style: Theme.of(context).textTheme.bodySmall
                ?.copyWith(color: colorScheme.onSurfaceVariant),
          ),
        ],
      ],
    );
  }

  Widget _buildMember(BuildContext context, MemberSession session) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final memberGroup = _memberGroup(session.member, groupsAsync);
    final enrolledCourses = _myCourseCount(coursesAsync);
    final servingCount = _servingCount(servingAsync);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            CircleAvatar(
              child: Text(
                session.member.displayName.isEmpty
                    ? 'M'
                    : session.member.displayName.substring(0, 1),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session.member.displayName,
                    style: Theme.of(context).textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  Text(
                    session.member.email,
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
            _MineChipAction(
              tooltip: l10n.groupMyGroupsTitle,
              onPressed: () => context.pushNamed(AppRouteNames.myGroups),
              child: AppChip(
                label: memberGroup ?? l10n.memberNoGroupLabel,
                icon: Icons.groups_outlined,
                variant: AppChipVariant.filled,
              ),
            ),
            _MineChipAction(
              tooltip: l10n.courseMyCoursesTitle,
              onPressed: () => context.pushNamed(AppRouteNames.myCourses),
              child: AppChip(
                label: l10n.mineLifeCoursesCountLabel(enrolledCourses),
                icon: Icons.school_outlined,
                variant: AppChipVariant.filled,
              ),
            ),
            _MineChipAction(
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

class _MineChipAction extends StatelessWidget {
  const _MineChipAction({
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

int _servingCount(AsyncValue<List<ServingAssignment>> servingAsync) {
  return servingAsync
      .maybeWhen(
        data: (items) => items,
        orElse: () => const <ServingAssignment>[],
      )
      .length;
}
