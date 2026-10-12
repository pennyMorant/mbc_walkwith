class BibleSearchResult {
  const BibleSearchResult({
    required this.verseId,
    required this.bookId,
    required this.bookName,
    required this.chapter,
    required this.verse,
    required this.text,
    required this.score,
    required this.bookSortOrder,
  });

  final String verseId;
  final String bookId;
  final String bookName;
  final int chapter;
  final int verse;
  final String text;
  final double score;
  final int bookSortOrder;

  String get reference => '$bookName $chapter:$verse';
}
