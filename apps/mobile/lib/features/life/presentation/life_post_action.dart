import 'package:flutter/material.dart';

import '../../../core/platform/external_link_service.dart';
import '../../../l10n/app_localizations.dart';
import '../domain/life_post.dart';

bool lifePostHasAction(LifePost post) {
  final label = post.ctaLabel?.trim();
  final url = post.ctaUrl?.trim();
  return label != null && label.isNotEmpty && url != null && url.isNotEmpty;
}

String lifePostActionLabel(AppLocalizations l10n, LifePost post) {
  final label = post.ctaLabel?.trim();
  return label == null || label.isEmpty ? l10n.lifePostActionOpen : label;
}

Future<void> openLifePostAction({
  required BuildContext context,
  required LifePost post,
  required ExternalLinkService linkService,
}) async {
  var opened = false;
  try {
    opened = await linkService.openExternalUrl(post.ctaUrl);
  } catch (_) {
    opened = false;
  }
  if (opened || !context.mounted) {
    return;
  }
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(AppLocalizations.of(context)!.lifePostActionOpenError),
    ),
  );
}
