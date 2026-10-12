import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/newcomer_repository.dart';
import 'package:mbc_walkwith/features/life/domain/newcomer_submission.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/newcomer_welcome_sheet.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';

void main() {
  testWidgets('submits a newcomer form only once during rapid taps', (
    tester,
  ) async {
    final repository = _PendingNewcomerRepository();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          newcomerRepositoryProvider.overrideWithValue(repository),
          newcomerIdentityProvider.overrideWith(
            (ref) async => const NewcomerIdentity(
              externalUserId: 'ext_test',
              session: null,
            ),
          ),
        ],
        child: const MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Scaffold(body: NewcomerWelcomeSheet()),
        ),
      ),
    );

    final fields = find.byType(TextField);
    await tester.enterText(fields.at(0), 'Grace Visitor');
    await tester.enterText(fields.at(1), 'grace@example.com');
    final submitButton = find.text('Send to church team');
    await tester.tap(submitButton);
    await tester.tap(submitButton);

    expect(repository.submitCount, 1);

    repository.pending.completeError(StateError('test failure'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}

class _PendingNewcomerRepository implements NewcomerRepository {
  final pending = Completer<NewcomerSubmission>();
  int submitCount = 0;

  @override
  Future<NewcomerSubmission> submitNewcomer({
    required NewcomerIdentity identity,
    required String displayName,
    required String preferredLanguage,
    String? email,
    String? phone,
    String? interest,
  }) {
    submitCount += 1;
    return pending.future;
  }
}
