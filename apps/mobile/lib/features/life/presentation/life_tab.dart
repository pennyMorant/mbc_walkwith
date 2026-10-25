import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/app_routes.dart';
import '../../../core/settings/app_settings.dart';
import '../../../core/settings/app_settings_repository.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/date_period.dart';
import '../../../shared/widgets/period_picker_button.dart';
import '../../../shared/widgets/app_chip.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../../shell/widgets/shell_app_bar.dart';
import '../data/care_repository.dart';
import '../data/course_repository.dart';
import '../data/group_repository.dart';
import '../data/life_repository.dart';
import '../data/prayer_repository.dart';
import '../data/serving_repository.dart';
import '../domain/life_post_list_request.dart';
import 'widgets/life_dashboard_tab_bar.dart';
import 'widgets/life_dashboard_view.dart';

class LifeTab extends ConsumerStatefulWidget {
  const LifeTab({super.key});

  @override
  ConsumerState<LifeTab> createState() => _LifeTabState();
}

class _LifeTabState extends ConsumerState<LifeTab> {
  DatePeriod _monthPeriod = DatePeriod.current(DatePeriodMode.month);
  LifeDashboardTab _selectedTab = LifeDashboardTab.week;
  final Set<LifeDashboardTab> _loadedSupportTabs = {LifeDashboardTab.week};

  LifePostListRequest get _monthRequest => _requestForPeriod(_monthPeriod);

  LifePostListRequest get _weekRequest {
    return _requestForPeriod(DatePeriod.current(DatePeriodMode.week));
  }

  LifePostListRequest _requestForPeriod(DatePeriod period) {
    return LifePostListRequest(
      limit: 80,
      loadAll: true,
      from: period.queryFrom,
      to: period.queryTo,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final weekRequest = _weekRequest;
    final monthRequest = _monthRequest;
    final weekPostsAsync = ref.watch(lifePostListProvider(weekRequest));
    final monthPostsAsync = ref.watch(lifePostListProvider(monthRequest));
    final heroPostAsync = ref.watch(latestLifeBulletinProvider(weekRequest));
    final memberSessionAsync = ref.watch(memberSessionProvider);
    final memberSession = memberSessionAsync.value;
    final settings = ref
        .watch(appSettingsProvider)
        .maybeWhen(
          data: (settings) => settings,
          orElse: () => AppSettings.unavailable,
        );

    return Scaffold(
      appBar: ShellAppBar(
        title: l10n.lifeTitle,
        actions: [
          IconButton(
            tooltip: l10n.eventCheckInScanAction,
            onPressed: () => context.pushNamed(AppRouteNames.lifeCheckInScan),
            icon: const Icon(Icons.qr_code_scanner_outlined),
          ),
          _selectedTab == LifeDashboardTab.week
              ? AppChip(label: l10n.lifeTabWeek, variant: AppChipVariant.filled)
              : PeriodPickerButton(
                  period: _monthPeriod,
                  onChanged: _changeMonth,
                  labelBuilder: _lifeMonthLabel,
                ),
        ],
      ),
      body: RefreshIndicator(
        triggerMode: RefreshIndicatorTriggerMode.onEdge,
        onRefresh: () => _refreshLife(
          ref,
          weekRequest: weekRequest,
          monthRequest: monthRequest,
        ),
        notificationPredicate: _lifeRefreshNotificationPredicate,
        child: LifeDashboardView(
          weekPostsAsync: weekPostsAsync,
          monthPostsAsync: monthPostsAsync,
          heroPostAsync: heroPostAsync,
          selectedTab: _selectedTab,
          onTabChanged: _changeTab,
          onRetryWeekPosts: () =>
              ref.invalidate(lifePostListProvider(weekRequest)),
          onRetryMonthPosts: () =>
              ref.invalidate(lifePostListProvider(monthRequest)),
          onRetryHero: () =>
              ref.invalidate(latestLifeBulletinProvider(weekRequest)),
          prayerEnabled: settings.prayerEnabled,
          publicPrayerRequestsAsync:
              _shouldLoad(LifeDashboardTab.prayer) && settings.prayerEnabled
              ? ref.watch(publicPrayerRequestsProvider)
              : const AsyncData([]),
          memberPrayerRequestsAsync:
              _shouldLoad(LifeDashboardTab.prayer) &&
                  settings.prayerEnabled &&
                  memberSession != null
              ? ref.watch(memberPrayerRequestsProvider)
              : const AsyncData([]),
          memberSession: memberSession,
          groupsAsync: _shouldLoad(LifeDashboardTab.groups)
              ? ref.watch(ministryGroupsProvider)
              : const AsyncData([]),
          coursesAsync: _shouldLoad(LifeDashboardTab.courses)
              ? ref.watch(coursesProvider)
              : const AsyncData([]),
          servingAsync:
              _shouldLoad(LifeDashboardTab.serving) && memberSession != null
              ? ref.watch(servingAssignmentsProvider)
              : const AsyncData([]),
          careRequestsAsync:
              _shouldLoad(LifeDashboardTab.prayer) && memberSession != null
              ? ref.watch(careRequestsProvider)
              : const AsyncData([]),
          memberSessionResolved:
              memberSessionAsync.hasValue || memberSessionAsync.hasError,
        ),
      ),
    );
  }

  void _changeMonth(DatePeriod period) {
    setState(() {
      _monthPeriod = period.mode == DatePeriodMode.month
          ? period
          : DatePeriod.fromDate(
              mode: DatePeriodMode.month,
              date: period.anchor,
            );
    });
  }

  void _changeTab(LifeDashboardTab tab) {
    if (tab == _selectedTab) {
      return;
    }
    setState(() {
      _selectedTab = tab;
      _loadedSupportTabs.add(tab);
    });
  }

  bool _shouldLoad(LifeDashboardTab tab) => _loadedSupportTabs.contains(tab);
}

Future<void> _refreshLife(
  WidgetRef ref, {
  required LifePostListRequest weekRequest,
  required LifePostListRequest monthRequest,
}) async {
  final refreshedWeekPosts = ref.refresh(
    lifePostListProvider(weekRequest).future,
  );
  final refreshedMonthPosts = ref.refresh(
    lifePostListProvider(monthRequest).future,
  );
  final refreshedHero = ref.refresh(
    latestLifeBulletinProvider(weekRequest).future,
  );
  await Future.wait([refreshedWeekPosts, refreshedMonthPosts, refreshedHero]);
  _refreshLifeSupportData(ref);
}

void _refreshLifeSupportData(WidgetRef ref) {
  ref.invalidate(publicPrayerRequestsProvider);
  ref.invalidate(memberPrayerRequestsProvider);
  ref.invalidate(ministryGroupsProvider);
  ref.invalidate(coursesProvider);
  ref.invalidate(servingAssignmentsProvider);
  ref.invalidate(careRequestsProvider);
}

bool _lifeRefreshNotificationPredicate(ScrollNotification notification) {
  final metrics = notification.metrics;
  if (metrics.axis != Axis.vertical) {
    return false;
  }
  return metrics.extentBefore <= _refreshTopEdgeTolerance ||
      metrics.pixels <= metrics.minScrollExtent + _refreshTopEdgeTolerance;
}

const _refreshTopEdgeTolerance = 24.0;
String _lifeMonthLabel(BuildContext context, DatePeriod period) {
  final locale = Localizations.localeOf(context).toLanguageTag();
  return DateFormat.MMM(locale).format(period.start);
}
