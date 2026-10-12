class BiblePerson {
  const BiblePerson({
    required this.id,
    required this.name,
    required this.role,
    required this.summary,
    required this.description,
    required this.sections,
    required this.aliases,
    required this.verseAliases,
    required this.relatedVerseIds,
  });

  final String id;
  final String name;
  final String role;
  final String summary;
  final String description;
  final List<BiblePersonSection> sections;
  final List<String> aliases;
  final Map<String, List<String>> verseAliases;
  final List<String> relatedVerseIds;
}

class BiblePersonSection {
  const BiblePersonSection({
    required this.type,
    required this.title,
    required this.body,
  });

  final String type;
  final String title;
  final String body;
}
