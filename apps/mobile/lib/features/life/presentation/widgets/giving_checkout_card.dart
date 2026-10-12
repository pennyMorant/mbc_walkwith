import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_error.dart';
import '../../../../core/platform/external_link_service.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/giving_repository.dart';
import '../../domain/giving_checkout_amount.dart';
import '../../domain/giving_record.dart';
import 'giving_fund_dropdown.dart';

class GivingCheckoutCard extends ConsumerStatefulWidget {
  const GivingCheckoutCard({super.key, required this.session});

  final MemberSession session;

  @override
  ConsumerState<GivingCheckoutCard> createState() => _GivingCheckoutCardState();
}

class _GivingCheckoutCardState extends ConsumerState<GivingCheckoutCard> {
  final _amountController = TextEditingController(text: '50');
  String? _selectedFundId;
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final fundsAsync = ref.watch(activeGivingFundsProvider(widget.session));
    final activeFunds = fundsAsync.maybeWhen(
      data: (funds) => funds,
      orElse: () => const <GivingFund>[],
    );
    final selectedFund = _selectedFund(activeFunds);
    final canStartCheckout = !_isLoading && activeFunds.isNotEmpty;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.givingCheckoutTitle,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.givingCheckoutBody,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 14),
            AppFilledTextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              hintText: l10n.givingAmountLabel,
              prefixText: 'USD ',
              prefixIcon: const Icon(Icons.attach_money),
            ),
            const SizedBox(height: 12),
            fundsAsync.when(
              loading: () => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const LinearProgressIndicator(),
                  const SizedBox(height: 8),
                  Text(
                    l10n.givingFundsLoading,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              error: (error, stackTrace) => Text(
                formatApiErrorMessage(error),
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colorScheme.error),
              ),
              data: (funds) {
                if (funds.isEmpty) {
                  return Text(
                    l10n.givingFundsEmpty,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: colorScheme.error),
                  );
                }
                return GivingFundDropdown(
                  funds: funds,
                  selectedFundId: selectedFund?.id,
                  onChanged: _isLoading
                      ? null
                      : (fundId) {
                          setState(() {
                            _selectedFundId = fundId;
                          });
                        },
                );
              },
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colorScheme.error),
              ),
            ],
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: canStartCheckout
                  ? () => _startCheckout(activeFunds)
                  : null,
              icon: _isLoading
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.lock_outline),
              label: Text(l10n.givingCheckoutAction),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _startCheckout(List<GivingFund> funds) async {
    final l10n = AppLocalizations.of(context)!;
    final fund = _selectedFund(funds);
    if (fund == null) {
      setState(() => _error = l10n.givingFundsEmpty);
      return;
    }
    final amountCents = parseGivingAmountCents(
      _amountController.text,
      localeTag: Localizations.localeOf(context).toLanguageTag(),
    );
    if (amountCents == null) {
      setState(() => _error = l10n.givingAmountError);
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final checkout = await ref
          .read(givingRepositoryProvider)
          .createCheckoutSession(
            session: widget.session,
            amountCents: amountCents,
            category: fund.code,
            fundId: fund.id,
          );
      final opened = await ref
          .read(externalLinkServiceProvider)
          .openExternalUrl(checkout.checkoutUrl);
      if (!opened) {
        throw StateError(l10n.givingCheckoutOpenError);
      }
      ref.invalidate(memberGivingOverviewProvider);
    } catch (error) {
      if (mounted) {
        setState(() => _error = formatApiErrorMessage(error));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  GivingFund? _selectedFund(List<GivingFund> funds) {
    if (funds.isEmpty) {
      return null;
    }
    for (final fund in funds) {
      if (fund.id == _selectedFundId) {
        return fund;
      }
    }
    return funds.first;
  }
}
