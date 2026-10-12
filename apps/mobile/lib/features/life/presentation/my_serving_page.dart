import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/serving_repository.dart';
import '../domain/serving_assignment.dart';
import '../domain/serving_availability.dart';
import 'widgets/life_dashboard_support_widgets.dart';
import 'widgets/life_error_view.dart';
import 'widgets/serving_assignment_section.dart';
import 'widgets/serving_availability_card.dart';
import 'widgets/serving_availability_sheet.dart';

class MyServingPage extends ConsumerWidget {
  const MyServingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final sessionAsync = ref.watch(memberSessionProvider);
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: SecondaryAppBar(
          title: l10n.servingTitle,
          onBack: () => _goBack(context),
        ),
        body: sessionAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => LifeErrorView(
            onRetry: () => ref.invalidate(memberSessionProvider),
          ),
          data: (session) => session == null
              ? const LifeMemberSignInCard()
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                      child: TabBar(
                        tabs: [
                          Tab(text: l10n.servingScheduleTab),
                          Tab(text: l10n.servingAvailabilityTab),
                        ],
                      ),
                    ),
                    Expanded(
                      child: TabBarView(
                        children: [
                          _ServingScheduleView(
                            session: session,
                            assignmentsAsync: ref.watch(
                              servingAssignmentsProvider,
                            ),
                          ),
                          _ServingAvailabilityView(
                            session: session,
                            availabilityAsync: ref.watch(
                              servingAvailabilityProvider,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.mine);
  }
}

class _ServingScheduleView extends ConsumerWidget {
  const _ServingScheduleView({
    required this.session,
    required this.assignmentsAsync,
  });

  final MemberSession session;
  final AsyncValue<List<ServingAssignment>> assignmentsAsync;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RefreshIndicator(
      onRefresh: () => ref.refresh(servingAssignmentsProvider.future),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          ServingAssignmentSection(
            assignmentsAsync: assignmentsAsync,
            memberSession: session,
            onOpen: (assignment) => context.pushNamed(
              AppRouteNames.servingDetail,
              pathParameters: {'assignmentId': assignment.id},
            ),
          ),
        ],
      ),
    );
  }
}

class _ServingAvailabilityView extends ConsumerWidget {
  const _ServingAvailabilityView({
    required this.session,
    required this.availabilityAsync,
  });

  final MemberSession session;
  final AsyncValue<List<ServingAvailability>> availabilityAsync;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    return availabilityAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => LifeErrorView(
        onRetry: () => ref.invalidate(servingAvailabilityProvider),
      ),
      data: (records) => RefreshIndicator(
        onRefresh: () => ref.refresh(servingAvailabilityProvider.future),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
          children: [
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: AppButton(
                label: l10n.servingAvailabilityAddAction,
                icon: Icons.add,
                variant: AppButtonVariant.filled,
                onPressed: () => _addAvailability(context),
              ),
            ),
            const SizedBox(height: 12),
            if (records.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Text(l10n.servingAvailabilityEmptyBody),
                ),
              )
            else
              for (final record in records) ...[
                ServingAvailabilityCard(record: record),
                const SizedBox(height: 8),
              ],
          ],
        ),
      ),
    );
  }

  Future<void> _addAvailability(BuildContext context) async {
    final created = await ServingAvailabilitySheet.show(
      context,
      session: session,
    );
    if (created && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.servingAvailabilityCreateSuccess,
          ),
        ),
      );
    }
  }
}
