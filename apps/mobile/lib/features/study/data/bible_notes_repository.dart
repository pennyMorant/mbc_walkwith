import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/identity/external_user_identity_repository.dart';
import '../../../features/member_auth/data/member_session_repository.dart';
import 'dto/bible_verse_note_dto.dart';
import '../domain/bible_note.dart';

final bibleNotesRepositoryProvider = Provider<BibleNotesRepository>((ref) {
  return ApiBibleNotesRepository(
    apiClient: ref.watch(apiClientProvider),
    ref: ref,
  );
});

final bibleVerseNotesProvider = FutureProvider.autoDispose
    .family<List<BibleVerseNote>, String>((ref, verseId) {
      return ref.watch(bibleNotesRepositoryProvider).listByVerse(verseId);
    });

abstract class BibleNotesRepository {
  Future<List<BibleVerseNote>> listByVerse(String verseId);

  Future<BibleVerseNote> create({
    required String verseId,
    required String bookId,
    required int chapter,
    required int verse,
    required String content,
    String? externalDisplayName,
  });

  Future<BibleVerseNote> update({
    required String noteId,
    required String content,
  });

  Future<void> delete(String noteId);
}

class ApiBibleNotesRepository implements BibleNotesRepository {
  const ApiBibleNotesRepository({required this.apiClient, required this.ref});

  final ApiClient apiClient;
  final Ref ref;

  @override
  Future<List<BibleVerseNote>> listByVerse(String verseId) async {
    final identity = await _identity();
    final response = await apiClient.getJsonMapWithIdentity(
      '/bible/verse-notes?verseId=${Uri.encodeQueryComponent(verseId)}',
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    return readBibleVerseNoteItems(response);
  }

  @override
  Future<BibleVerseNote> create({
    required String verseId,
    required String bookId,
    required int chapter,
    required int verse,
    required String content,
    String? externalDisplayName,
  }) async {
    final identity = await _identity();
    final response = await apiClient.postJsonMapWithIdentity(
      '/bible/verse-notes',
      {
        'verseId': verseId,
        'bookId': bookId,
        'chapter': chapter,
        'verse': verse,
        'content': content,
        if (externalDisplayName?.trim().isNotEmpty == true)
          'externalDisplayName': externalDisplayName!.trim(),
      },
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    return readBibleVerseNoteResponse(response);
  }

  @override
  Future<BibleVerseNote> update({
    required String noteId,
    required String content,
  }) async {
    final identity = await _identity();
    final response = await apiClient.patchJsonMapWithIdentity(
      '/bible/verse-notes/$noteId',
      {'content': content},
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    return readBibleVerseNoteResponse(response);
  }

  @override
  Future<void> delete(String noteId) async {
    final identity = await _identity();
    await apiClient.deleteJsonMapWithIdentity(
      '/bible/verse-notes/$noteId',
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
  }

  Future<_BibleNotesIdentity> _identity() async {
    final externalUserId = await ref
        .read(externalUserIdentityRepositoryProvider)
        .externalUserId();
    final session = await ref.read(memberSessionProvider.future);
    return _BibleNotesIdentity(
      externalUserId: externalUserId,
      accessToken: session?.accessToken,
    );
  }
}

class _BibleNotesIdentity {
  const _BibleNotesIdentity({required this.externalUserId, this.accessToken});

  final String externalUserId;
  final String? accessToken;
}
