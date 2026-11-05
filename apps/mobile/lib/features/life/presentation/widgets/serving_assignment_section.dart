import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/serving_repository.dart';
import '../../domain/serving_assignment.dart';
import '../life_action_error_message.dart';
import 'life_dashboard_support_widgets.dart';
import 'serving_assignment_card.dart';

class ServingAssignmentSection extends ConsumerStatefulWidget {
  const ServingAssignmentSection({
    super.key,
    required this.assignmentsAsync,
    required this.memberSession,
    this.onOpen,
  });

  final AsyncValue<List<ServingAssignment>> assignmentsAsync;
  final MemberSession memberSession;
  final ValueChanged<ServingAssignment>? onOpen;

  @override
  ConsumerState<ServingAssignmentSection> createState() =>
      _ServingAssignmentSectionState();
}

class _ServingAssignmentSectionState
    extends ConsumerState<ServingAssignmentSection> {
  ({String assignmentId, ServingAssignmentCardPendingAction action})?
  _submittingAssignment;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (widget.assignmentsAsync.isLoading) {
      return const Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: LinearProgressIndicator(),
      );
    }
    if (widget.assignmentsAsync.hasError) {
      return LifeEmptyTabCard(
        title: l10n.servingTitle,
        body: l10n.lifeSectionLoadError,
        action: TextButton.icon(
          onPressed: () => ref.invalidate(servingAssignmentsProvider),
          icon: const Icon(Icons.refresh),
          label: Text(l10n.retryAction),
        ),
      );
    }

    final assignments =
        widget.assignmentsAsync.value ?? const <ServingAssignment>[];
    if (assignments.isEmpty) {
      return LifeEmptyTabCard(
        title: l10n.servingTitle,
        body: l10n.servingEmptyBody,
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Column(
        children: [
          for (final assignment in assignments) ...[
            ServingAssignmentCard(
              assignment: assignment,
              pendingAction:
                  _submittingAssignment?.assignmentId == assignment.id
                  ? _submittingAssignment?.action
                  : null,
              onConfirm: () => _submit(assignment, confirm: true),
              onLeave: () => _submit(assignment, confirm: false),
              onOpen: widget.onOpen == null
                  ? null
                  : () => widget.onOpen!(assignment),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }

  Future<void> _submit(
    ServingAssignment assignment, {
    required bool confirm,
  }) async {
    if (_submittingAssignment != null) {
      return;
    }
    setState(
      () => _submittingAssignment = (
        assignmentId: assignment.id,
        action: confirm
            ? ServingAssignmentCardPendingAction.confirm
            : ServingAssignmentCardPendingAction.requestLeave,
      ),
    );
    try {
      final repository = ref.read(servingRepositoryProvider);
      if (confirm) {
        await repository.confirm(assignment.id, widget.memberSession);
      } else {
        await repository.requestLeave(assignment.id, widget.memberSession);
      }
      ref.invalidate(servingAssignmentsProvider);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            confirm
                ? AppLocalizations.of(context)!.servingConfirmSuccess
                : AppLocalizations.of(context)!.servingLeaveSuccess,
          ),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lifeActionErrorMessage(
              error,
              fallback: AppLocalizations.of(context)!.lifeActionError,
            ),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _submittingAssignment = null);
      }
    }
  }
}
