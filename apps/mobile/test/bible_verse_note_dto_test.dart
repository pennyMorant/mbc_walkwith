import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/data/dto/bible_verse_note_dto.dart';

void main() {
  test('maps a complete verse note response', () {
    final note = readBibleVerseNoteResponse({'data': _noteJson()});

    expect(note.id, 'note_1');
    expect(note.verseId, 'rom.8.28');
    expect(note.authorType, 'external');
    expect(note.isMine, isTrue);
  });

  test('maps a strict list response without dropping entries', () {
    final notes = readBibleVerseNoteItems({
      'data': {
        'items': [_noteJson(), _noteJson(id: 'note_2')],
      },
    });

    expect(notes.map((note) => note.id), ['note_1', 'note_2']);
  });

  test('rejects malformed envelopes and list entries', () {
    expect(
      () => readBibleVerseNoteItems(const {'data': {}}),
      throwsFormatException,
    );
    expect(
      () => readBibleVerseNoteItems(const {
        'data': {
          'items': ['not-an-object'],
        },
      }),
      throwsFormatException,
    );
  });

  test('rejects missing fields and unsupported author types', () {
    final missingId = _noteJson()..remove('id');
    final unsupportedAuthor = _noteJson()..['authorType'] = 'admin';

    expect(
      () => readBibleVerseNoteResponse({'data': missingId}),
      throwsFormatException,
    );
    expect(
      () => readBibleVerseNoteResponse({'data': unsupportedAuthor}),
      throwsFormatException,
    );
  });

  test('rejects mismatched references and impossible timestamps', () {
    final mismatchedReference = _noteJson()..['verseId'] = 'rom.8.27';
    final reversedDates = _noteJson()
      ..['createdAt'] = '2026-07-13T02:00:00.000Z'
      ..['updatedAt'] = '2026-07-13T01:00:00.000Z';

    expect(
      () => readBibleVerseNoteResponse({'data': mismatchedReference}),
      throwsFormatException,
    );
    expect(
      () => readBibleVerseNoteResponse({'data': reversedDates}),
      throwsFormatException,
    );
  });
}

Map<String, Object?> _noteJson({String id = 'note_1'}) {
  return {
    'id': id,
    'verseId': 'rom.8.28',
    'bookId': 'rom',
    'chapter': 8,
    'verse': 28,
    'content': 'God works through every season.',
    'authorType': 'external',
    'authorDisplayName': 'Visitor',
    'isMine': true,
    'createdAt': '2026-07-13T01:00:00.000Z',
    'updatedAt': '2026-07-13T01:00:00.000Z',
  };
}
