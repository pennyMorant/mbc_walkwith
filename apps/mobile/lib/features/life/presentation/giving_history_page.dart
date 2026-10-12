import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/giving_repository.dart';
import '../domain/giving_checkout_return.dart';
import 'widgets/giving_checkout_card.dart';
import 'widgets/giving_history_cards.dart';

class GivingHistoryPage extends ConsumerStatefulWidget {
  const GivingHistoryPage({
    super.key,
    this.checkoutReturn,
    this.onCheckoutReturnHandled,
  });

  final GivingCheckoutReturn? checkoutReturn;
  final VoidCallback? onCheckoutReturnHandled;

  @override
  ConsumerState<GivingHistoryPage> createState() => _GivingHistoryPageState();
}

class _GivingHistoryPageState extends ConsumerState<GivingHistoryPage> {
  final List<Timer> _confirmationTimers = [];
  GivingCheckoutReturn? _handledCheckoutReturn;

  @override
  void initState() {
    super.initState();
    _scheduleCheckoutReturn(widget.checkoutReturn);
  }

  @override
  void didUpdateWidget(covariant GivingHistoryPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.checkoutReturn == null) {
      _handledCheckoutReturn = null;
    }
    _scheduleCheckoutReturn(widget.checkoutReturn);
  }

  @override
  void dispose() {
    _cancelConfirmationTimers();
    super.dispose();
  }

  void _scheduleCheckoutReturn(GivingCheckoutReturn? checkoutReturn) {
    if (checkoutReturn == null || checkoutReturn == _handledCheckoutReturn) {
      return;
    }
    _handledCheckoutReturn = checkoutReturn;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      final l10n = AppLocalizations.of(context)!;
      final isFinished = checkoutReturn == GivingCheckoutReturn.finished;
      final message = isFinished
          ? l10n.givingCheckoutReturnSuccess
          : l10n.givingCheckoutReturnCancel;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
      _refreshGivingAfterCheckout(
        isFinished,
        onComplete: widget.onCheckoutReturnHandled,
      );
    });
  }

  void _refreshGivingAfterCheckout(
    bool pollForConfirmation, {
    VoidCallback? onComplete,
  }) {
    _cancelConfirmationTimers();
    ref.invalidate(memberGivingOverviewProvider);
    if (!pollForConfirmation) {
      onComplete?.call();
      return;
    }
    const delays = [
      Duration(seconds: 5),
      Duration(seconds: 15),
      Duration(seconds: 30),
    ];
    for (var index = 0; index < delays.length; index += 1) {
      final isLastPoll = index == delays.length - 1;
      late final Timer timer;
      timer = Timer(delays[index], () {
        _confirmationTimers.remove(timer);
        if (mounted) {
          ref.invalidate(memberGivingOverviewProvider);
          if (isLastPoll) {
            onComplete?.call();
          }
        }
      });
      _confirmationTimers.add(timer);
    }
  }

  void _cancelConfirmationTimers() {
    for (final timer in _confirmationTimers) {
      timer.cancel();
    }
    _confirmationTimers.clear();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = ref
        .watch(memberSessionProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);
    final overviewAsync = ref.watch(memberGivingOverviewProvider);

    return Scaffold(
      appBar: SecondaryAppBar(title: l10n.givingHistoryTitle),
      body: overviewAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => GivingMessageCard(
          title: l10n.givingTitle,
          body: formatApiErrorMessage(error),
        ),
        data: (overview) {
          if (session == null || overview == null) {
            return _GuestGivingView(
              onSignIn: () => context.pushNamed(AppRouteNames.memberLoginEmail),
            );
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            children: [
              GivingCheckoutCard(session: session),
              const SizedBox(height: 12),
              GivingSummaryCard(overview: overview),
              const SizedBox(height: 20),
              Text(
                l10n.givingTransactionsTitle,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              if (overview.transactions.isEmpty)
                GivingMessageCard(
                  title: l10n.givingTransactionsTitle,
                  body: l10n.givingTransactionsEmptyBody,
                )
              else
                for (final transaction in overview.transactions) ...[
                  GivingTransactionCard(transaction: transaction),
                  const SizedBox(height: 8),
                ],
            ],
          );
        },
      ),
    );
  }
}

class _GuestGivingView extends StatelessWidget {
  const _GuestGivingView({required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      children: [
        GivingMessageCard(
          title: l10n.givingTitle,
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
