import 'dart:async';

import 'package:app_settings/app_settings.dart' as device_settings;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_version.dart';
import '../../../core/platform/external_link_service.dart';
import '../../../core/settings/app_settings.dart';
import '../../../core/settings/app_settings_repository.dart';
import '../../../core/settings/app_text_scale_provider.dart';
import '../../../l10n/app_localizations.dart';
import '../../../theme/theme_provider.dart';
import '../../discipleship/presentation/widgets/mine_discipleship_card.dart';
import '../../life/data/course_repository.dart';
import '../../life/data/group_repository.dart';
import '../../life/data/serving_repository.dart';
import '../../life/presentation/push_notifications_controller.dart';
import '../../life/presentation/notification_inbox_provider.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../../shell/widgets/shell_app_bar.dart';
import '../../study/domain/bible_translation.dart';
import '../../study/presentation/reader_assist_settings_provider.dart';
import 'widgets/about_church_card.dart';
import 'widgets/mine_giving_card.dart';
import 'widgets/mine_activity_card.dart';
import 'widgets/mine_reading_plan_card.dart';
import 'widgets/member_session_card.dart';
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
    final notificationInbox = ref.watch(notificationInboxProvider);
    final memberSessionAsync = ref.watch(memberSessionProvider);
    final memberSession = memberSessionAsync.maybeWhen(
      data: (session) => session,
      orElse: () => null,
    );
    final settings = ref
        .watch(appSettingsProvider)
        .maybeWhen(
          data: (settings) => settings,
          orElse: () => AppSettings.unavailable,
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
          const SizedBox(height: 12),
          MineActivityCard(
            unreadNotificationCount: notificationInbox.unreadCount,
            showRegistrations: memberSession != null,
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
