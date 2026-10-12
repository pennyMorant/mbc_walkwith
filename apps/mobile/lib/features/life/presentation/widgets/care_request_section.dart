import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../data/care_repository.dart';
import '../../domain/care_request.dart';
import 'care_request_card.dart';
import 'life_dashboard_support_widgets.dart';

class CareRequestSection extends ConsumerWidget {
  const CareRequestSection({super.key, required this.requestsAsync});

  final AsyncValue<List<CareRequest>> requestsAsync;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final requests = requestsAsync.maybeWhen(
      data: (requests) => requests,
      orElse: () => const <CareRequest>[],
    );

    if (requestsAsync.isLoading) {
      return const Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: LinearProgressIndicator(),
      );
    }

    if (requests.isEmpty && requestsAsync.hasError) {
      return LifeEmptyTabCard(
        title: l10n.careTitle,
        body: l10n.lifeSectionLoadError,
        action: TextButton.icon(
          onPressed: () => ref.invalidate(careRequestsProvider),
          icon: const Icon(Icons.refresh),
          label: Text(l10n.retryAction),
        ),
      );
    }

    if (requests.isEmpty) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Text(l10n.careEmptyBody),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Column(
        children: [
          for (final request in requests) ...[
            CareRequestCard(request: request),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}
