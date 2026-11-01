import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/core/storage/session_store.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/mine/presentation/member_profile_page.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('profile form adopts the canonical member returned after save', (
    tester,
  ) async {
    final repository = _CanonicalProfileRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          memberSessionRepositoryProvider.overrideWithValue(repository),
          memberSessionProvider.overrideWith((ref) async => _initialSession),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const MemberProfilePage(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final l10n = AppLocalizations.of(
      tester.element(find.byType(MemberProfilePage)),
    )!;
    final nameField = find.widgetWithText(TextField, l10n.memberNameLabel);
    final phoneField = find.widgetWithText(TextField, l10n.memberPhoneLabel);
    await tester.enterText(nameField, '  Updated Member  ');
    await tester.enterText(phoneField, '626 555 0100');

    await tester.scrollUntilVisible(
      find.text(l10n.memberProfileSaveAction),
      240,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text(l10n.memberProfileSaveAction));
    await tester.pumpAndSettle();

    expect(repository.updateCount, 1);
    expect(
      tester.widget<TextField>(nameField).controller?.text,
      'Updated Member',
    );
    expect(
      tester.widget<TextField>(phoneField).controller?.text,
      '(626) 555-0100',
    );
    expect(find.text(l10n.memberProfileSaved), findsOneWidget);
  });
}

class _CanonicalProfileRepository extends MemberSessionRepository {
  _CanonicalProfileRepository()
    : super(
        apiClient: ApiClient(config: _config),
        sessionStore: _MemorySessionStore(),
      );

  int updateCount = 0;

  @override
  Future<MemberSession> updateProfile(
    MemberSession session, {
    required String displayName,
    String? phone,
    String? address,
    int? faithStartYear,
    int? baptizedYear,
    String? joinedChurchAt,
    String? emergencyContactName,
    String? emergencyContactPhone,
  }) async {
    updateCount += 1;
    return const MemberSession(
      accessToken: 'member-token',
      member: MemberProfile(
        id: 'member-1',
        email: 'member@example.com',
        displayName: 'Updated Member',
        phone: '(626) 555-0100',
        roles: ['member'],
        appLocale: 'en',
        fellowshipGroupId: null,
        notificationSettings: MemberNotificationSettings.defaults,
      ),
    );
  }
}

class _MemorySessionStore implements SessionStore {
  @override
  Future<void> clearAccessToken() async {}

  @override
  Future<void> clearMemberProfileJson() async {}

  @override
  Future<void> clearSession() async {}

  @override
  Future<String?> readAccessToken() async => null;

  @override
  Future<String?> readMemberProfileJson() async => null;

  @override
  Future<void> writeAccessToken(String accessToken) async {}

  @override
  Future<void> writeMemberProfileJson(String profileJson) async {}
}

const _config = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: true,
);

const _initialSession = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Original Member',
    phone: '6265550100',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);
