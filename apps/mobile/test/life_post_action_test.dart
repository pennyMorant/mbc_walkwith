import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/platform/external_link_service.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/presentation/life_post_action.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';

void main() {
  testWidgets('Life CTA shows a localized error when the link cannot open', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(
          body: Builder(
            builder: (context) => FilledButton(
              onPressed: () => openLifePostAction(
                context: context,
                post: _post,
                linkService: const _UnavailableLinkService(),
              ),
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();

    expect(
      find.text('This link could not be opened. Please try again.'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });
}

class _UnavailableLinkService extends ExternalLinkService {
  const _UnavailableLinkService();

  @override
  Future<bool> openExternalUrl(String? url) async => false;
}

const _post = LifePost(
  id: 'life-cta',
  type: 'event',
  title: 'Event',
  body: 'Body',
  meta: '',
  iconName: 'event',
  ctaLabel: 'Open',
  ctaUrl: 'https://example.com/event',
);
