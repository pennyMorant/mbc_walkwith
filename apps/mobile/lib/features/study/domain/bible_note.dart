class BibleVerseNote {
  const BibleVerseNote({
    required this.id,
    required this.verseId,
    required this.bookId,
    required this.chapter,
    required this.verse,
    required this.content,
    required this.authorType,
    required this.authorDisplayName,
    required this.isMine,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String verseId;
  final String bookId;
  final int chapter;
  final int verse;
  final String content;
  final String authorType;
  final String authorDisplayName;
  final bool isMine;
  final DateTime createdAt;
  final DateTime updatedAt;
}
