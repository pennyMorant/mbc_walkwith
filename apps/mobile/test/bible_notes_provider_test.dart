import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/identity/external_user_identity_repository.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/study/data/bible_notes_repository.dart';
import 'package:mbc_walkwith/features/study/domain/bible_note.dart';

void main() {
  test('reloads verse ownership when the member session changes', () async {
    final repository = _IdentityAwareBibleNotesRepository();
    var currentSession = _firstSession;
    final container = ProviderContainer.test(
      overrides: [
        externalUserIdProvider.overrideWith((ref) async => 'ext-test'),
        memberSessionProvider.overrideWith((ref) async => currentSession),
        bibleNotesRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);
    final subscription = container.listen(
      bibleVerseNotesProvider('rom.8.28'),
      (_, _) {},
      fireImmediately: true,
    );
    addTearDown(subscription.close);

    final first = await container.read(
      bibleVerseNotesProvider('rom.8.28').future,
    );
    final firstNoteId = first.single.id;

    currentSession = _secondSession;
    container.invalidate(memberSessionProvider);
    await container.read(memberSessionProvider.future);
    await _waitFor(() => repository.listCalls > 1);

    final second = await container.read(
      bibleVerseNotesProvider('rom.8.28').future,
    );
    expect(second.single.id, isNot(firstNoteId));
  });
}

Future<void> _waitFor(bool Function() predicate) async {
  for (var attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await Future<void>.delayed(Duration.zero);
  }
  fail('Condition was not reached.');
}

class _IdentityAwareBibleNotesRepository implements BibleNotesRepository {
  int listCalls = 0;

  @override
  Future<List<BibleVerseNote>> listByVerse(String verseId) async {
    listCalls += 1;
    return [_note('note-$listCalls')];
  }

  @override
  Future<BibleVerseNote> create({
    required String verseId,
    required String bookId,
    required int chapter,
    required int verse,
    required String content,
    String? externalDisplayName,
  }) async => _note('created');

  @override
  Future<void> delete(String noteId) async {}

  @override
  Future<BibleVerseNote> update({
    required String noteId,
    required String content,
  }) async => _note(noteId);
}

BibleVerseNote _note(String id) {
  return BibleVerseNote(
    id: id,
    verseId: 'rom.8.28',
    bookId: 'rom',
    chapter: 8,
    verse: 28,
    content: 'A reflection',
    authorType: 'member',
    authorDisplayName: 'Member',
    isMine: true,
    createdAt: DateTime.utc(2026, 7, 13),
    updatedAt: DateTime.utc(2026, 7, 13),
  );
}

const _firstSession = MemberSession(
  accessToken: 'token-1',
  member: MemberProfile(
    id: 'member-1',
    email: 'one@example.com',
    displayName: 'One',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);

const _secondSession = MemberSession(
  accessToken: 'token-2',
  member: MemberProfile(
    id: 'member-2',
    email: 'two@example.com',
    displayName: 'Two',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);
