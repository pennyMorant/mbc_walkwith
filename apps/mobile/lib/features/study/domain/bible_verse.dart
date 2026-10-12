class BibleVerse {
  const BibleVerse({
    required this.id,
    required this.number,
    required this.text,
    this.hasLexicon = false,
  });

  final String id;
  final int number;
  final String text;
  final bool hasLexicon;
}
