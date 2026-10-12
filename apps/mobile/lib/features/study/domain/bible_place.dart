class BiblePlace {
  const BiblePlace({
    required this.id,
    required this.name,
    required this.category,
    required this.summary,
    required this.description,
    required this.sections,
    required this.aliases,
    required this.verseAliases,
  });

  final String id;
  final String name;
  final String category;
  final String summary;
  final String description;
  final List<BiblePlaceSection> sections;
  final List<String> aliases;
  final Map<String, List<String>> verseAliases;
}

class BiblePlaceSection {
  const BiblePlaceSection({
    required this.type,
    required this.title,
    required this.body,
  });

  final String type;
  final String title;
  final String body;
}
