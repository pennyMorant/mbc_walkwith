import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/giving_repository.dart';
import '../domain/giving_record.dart';
import 'widgets/annual_statement_card.dart';
import 'widgets/annual_statement_export_sheet.dart';

class AnnualStatementsPage extends ConsumerStatefulWidget {
  const AnnualStatementsPage({super.key});

  @override
  ConsumerState<AnnualStatementsPage> createState() =>
      _AnnualStatementsPageState();
}

class _AnnualStatementsPageState extends ConsumerState<AnnualStatementsPage> {
  int? _loadingYear;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = ref
        .watch(memberSessionProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);
    final overviewAsync = ref.watch(memberGivingOverviewProvider);

    return Scaffold(
      appBar: SecondaryAppBar(title: l10n.annualStatementsTitle),
      body: overviewAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) =>
            _StatementsMessageCard(body: formatApiErrorMessage(error)),
        data: (overview) {
          if (session == null || overview == null) {
            return _StatementsGuestView(
              onSignIn: () => context.pushNamed(AppRouteNames.memberLoginEmail),
            );
          }
          if (overview.statements.isEmpty) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              children: [
                _StatementsMessageCard(body: l10n.annualStatementsEmptyBody),
              ],
            );
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            children: [
              for (final statement in overview.statements) ...[
                AnnualStatementCard(
                  statement: statement,
                  isLoading: _loadingYear == statement.taxYear,
                  onPreview: _canPreview(statement)
                      ? () => _previewStatement(session, statement.taxYear)
                      : null,
                ),
                const SizedBox(height: 8),
              ],
            ],
          );
        },
      ),
    );
  }

  bool _canPreview(GivingStatement statement) {
    return statement.status == 'ready' || statement.status == 'sent';
  }

  Future<void> _previewStatement(MemberSession session, int year) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _loadingYear = year);
    try {
      final export = await ref
          .read(givingRepositoryProvider)
          .fetchStatementExport(session: session, year: year);
      if (!mounted) {
        return;
      }
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (context) => AnnualStatementExportSheet(export: export),
      );
    } catch (error) {
      messenger.showSnackBar(
        SnackBar(content: Text(formatApiErrorMessage(error))),
      );
    } finally {
      if (mounted) {
        setState(() => _loadingYear = null);
      }
    }
  }
}

class _StatementsGuestView extends StatelessWidget {
  const _StatementsGuestView({required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      children: [
        _StatementsMessageCard(
          body: l10n.givingGuestBody,
          action: FilledButton.icon(
            onPressed: onSignIn,
            icon: const Icon(Icons.login),
            label: Text(l10n.memberSignInAction),
          ),
        ),
      ],
    );
  }
}

class _StatementsMessageCard extends StatelessWidget {
  const _StatementsMessageCard({required this.body, this.action});

  final String body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.annualStatementsTitle,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              body,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            if (action != null) ...[const SizedBox(height: 14), action!],
          ],
        ),
      ),
    );
  }
}
