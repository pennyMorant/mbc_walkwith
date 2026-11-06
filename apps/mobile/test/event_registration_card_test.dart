import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/event_registration_card.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/event_registration_pending_action.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets(
    'registration actions fit Spanish large text and load only one action',
    (tester) async {
      tester.view.physicalSize = const Size(320, 760);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final noteController = TextEditingController(text: 'Necesito ayuda');
      addTearDown(noteController.dispose);

      await tester.pumpWidget(
        MaterialApp(
          locale: const Locale('es'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: const TextScaler.linear(1.3)),
            child: child!,
          ),
          home: Scaffold(
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: EventRegistrationCard(
                post: LifePost(
                  id: 'family-retreat',
                  type: 'event',
                  title: 'Retiro familiar',
                  body: 'Detalles del retiro.',
                  meta: '',
                  iconName: 'event',
                  registrationEnabled: true,
                  registrationCapacity: 40,
                  registrationMaxPartySize: 5,
                  registrationSummary: const EventRegistrationSummary(
                    enabled: true,
                    capacity: 40,
                    registeredCount: 12,
                    remainingCount: 28,
                    myRegistrationStatus: EventRegistrationStatus.confirmed,
                    myPartySize: 3,
                    myNote: 'Necesito ayuda',
                  ),
                ),
                pendingAction: EventRegistrationPendingAction.update,
                isSignedIn: true,
                onSignIn: _noop,
                onRegister: _noop,
                onUpdate: _noop,
                onCancel: _noop,
                onCheckIn: _noop,
                noteController: noteController,
                partySize: 3,
                onPartySizeChanged: _ignorePartySize,
              ),
            ),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Actualizar inscripción'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}

void _noop() {}

void _ignorePartySize(int value) {}
