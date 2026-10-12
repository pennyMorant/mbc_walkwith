import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/app_formatters.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_chip.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/serving_repository.dart';
import '../domain/serving_assignment.dart';
import '../domain/serving_check_in.dart';
import 'serving_presenters.dart';
import 'widgets/life_dashboard_support_widgets.dart';
import 'widgets/life_error_view.dart';
import 'widgets/serving_assignment_card.dart';

class ServingAssignmentDetailPage extends ConsumerStatefulWidget {
  const ServingAssignmentDetailPage({super.key, required this.assignmentId});

  final String assignmentId;

  @override
  ConsumerState<ServingAssignmentDetailPage> createState() =>
      _ServingAssignmentDetailPageState();
}

class _ServingAssignmentDetailPageState
    extends ConsumerState<ServingAssignmentDetailPage> {
  String? _pendingAction;

  @override
  Widget build(BuildContext context) {
    final sessionAsync = ref.watch(memberSessionProvider);
    return Scaffold(
      appBar: SecondaryAppBar(title: '', onBack: () => _goBack(context)),
      body: sessionAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) =>
            LifeErrorView(onRetry: () => ref.invalidate(memberSessionProvider)),
        data: (session) {
          if (session == null) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
              children: const [LifeMemberSignInCard()],
            );
          }
          final assignmentAsync = ref.watch(
            servingAssignmentByIdProvider(widget.assignmentId),
          );
          final checkInsAsync = ref.watch(servingCheckInsProvider);
          return assignmentAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stackTrace) => LifeErrorView(
              onRetry: () => ref.invalidate(
                servingAssignmentByIdProvider(widget.assignmentId),
              ),
            ),
            data: (assignment) => checkInsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stackTrace) => LifeErrorView(
                onRetry: () => ref.invalidate(servingCheckInsProvider),
              ),
              data: (checkIns) => _buildContent(
                assignment,
                _checkInForAssignment(checkIns, assignment.id),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildContent(ServingAssignment assignment, ServingCheckIn? checkIn) {
    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          ref.refresh(servingAssignmentsProvider.future),
          ref.refresh(servingCheckInsProvider.future),
        ]);
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
        children: [
          ServingAssignmentCard(
            assignment: assignment,
            isSubmitting: _pendingAction != null,
            onConfirm: () => _updateAssignment(assignment, confirm: true),
            onLeave: () => _updateAssignment(assignment, confirm: false),
          ),
          const SizedBox(height: 12),
          _ServingCheckInCard(
            assignment: assignment,
            checkIn: checkIn,
            isSubmitting: _pendingAction == 'check_in',
            onCheckIn: () => _checkIn(assignment),
          ),
          if (assignment.note.isNotEmpty) ...[
            const SizedBox(height: 12),
            _ServingTextCard(
              title: AppLocalizations.of(context)!.servingAssignmentNoteTitle,
              body: assignment.note,
            ),
          ],
          if (assignment.responseNote.isNotEmpty) ...[
            const SizedBox(height: 12),
            _ServingTextCard(
              title: AppLocalizations.of(context)!.servingResponseNoteTitle,
              body: assignment.responseNote,
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _updateAssignment(
    ServingAssignment assignment, {
    required bool confirm,
  }) async {
    if (_pendingAction != null) {
      return;
    }
    final l10n = AppLocalizations.of(context)!;
    final session = await ref.read(memberSessionProvider.future);
    if (session == null || !mounted) {
      return;
    }
    setState(() => _pendingAction = confirm ? 'confirm' : 'leave');
    try {
      final repository = ref.read(servingRepositoryProvider);
      if (confirm) {
        await repository.confirm(assignment.id, session);
      } else {
        await repository.requestLeave(assignment.id, session);
      }
      ref.invalidate(servingAssignmentsProvider);
      _showSuccess(
        confirm ? l10n.servingConfirmSuccess : l10n.servingLeaveSuccess,
      );
    } catch (error) {
      _showError(error);
    } finally {
      if (mounted) {
        setState(() => _pendingAction = null);
      }
    }
  }

  Future<void> _checkIn(ServingAssignment assignment) async {
    if (_pendingAction != null) {
      return;
    }
    final successMessage = AppLocalizations.of(context)!.servingCheckInSuccess;
    final session = await ref.read(memberSessionProvider.future);
    if (session == null || !mounted) {
      return;
    }
    setState(() => _pendingAction = 'check_in');
    try {
      await ref.read(servingRepositoryProvider).checkIn(assignment.id, session);
      ref.invalidate(servingCheckInsProvider);
      _showSuccess(successMessage);
    } catch (error) {
      _showError(error);
    } finally {
      if (mounted) {
        setState(() => _pendingAction = null);
      }
    }
  }

  void _showSuccess(String message) {
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    }
  }

  void _showError(Object error) {
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(formatApiErrorMessage(error))));
    }
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.myServing);
  }
}

class _ServingCheckInCard extends StatelessWidget {
  const _ServingCheckInCard({
    required this.assignment,
    required this.checkIn,
    required this.isSubmitting,
    required this.onCheckIn,
  });

  final ServingAssignment assignment;
  final ServingCheckIn? checkIn;
  final bool isSubmitting;
  final VoidCallback onCheckIn;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final current = checkIn;
    final canCheckIn =
        assignment.canCheckIn && (current?.canMemberCheckIn ?? true);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    l10n.servingCheckInTitle,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                if (current != null)
                  AppChip(
                    label: servingCheckInStatusLabel(l10n, current.status),
                    selected: current.status == 'checked_in',
                    variant: AppChipVariant.filled,
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              current?.checkedInAt == null
                  ? l10n.servingCheckInNotRecorded
                  : formatDateTime(context, current!.checkedInAt!.toLocal()),
            ),
            if (canCheckIn) ...[
              const SizedBox(height: 14),
              AppButton(
                label: l10n.servingCheckInAction,
                icon: Icons.how_to_reg_outlined,
                variant: AppButtonVariant.filled,
                loading: isSubmitting,
                onPressed: onCheckIn,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ServingTextCard extends StatelessWidget {
  const _ServingTextCard({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(body),
          ],
        ),
      ),
    );
  }
}

ServingCheckIn? _checkInForAssignment(
  List<ServingCheckIn> checkIns,
  String assignmentId,
) {
  for (final checkIn in checkIns) {
    if (checkIn.assignmentId == assignmentId) {
      return checkIn;
    }
  }
  return null;
}
