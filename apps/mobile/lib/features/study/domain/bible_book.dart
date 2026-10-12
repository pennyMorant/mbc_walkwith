enum BibleTestament { old, newTestament }

enum BibleBookCategory {
  law,
  oldTestamentHistory,
  wisdom,
  majorProphets,
  minorProphets,
  gospels,
  acts,
  paulineLetters,
  generalLetters,
  apocalyptic,
}

class BibleBook {
  const BibleBook({
    required this.id,
    required this.testament,
    required this.category,
    required this.nameZh,
    required this.nameEn,
    required this.abbreviationZh,
    required this.abbreviationEn,
    required this.chapterCount,
    required this.sortOrder,
  });

  final String id;
  final BibleTestament testament;
  final BibleBookCategory category;
  final String nameZh;
  final String nameEn;
  final String abbreviationZh;
  final String abbreviationEn;
  final int chapterCount;
  final int sortOrder;
}
