import 'bible_person.dart';
import 'bible_verse.dart';

List<BiblePerson> findUniqueBiblePeopleInChapter({
  required List<BibleVerse> verses,
  required List<BiblePerson> people,
}) {
  if (verses.isEmpty || people.isEmpty) {
    return const [];
  }

  final ids = <String>{};
  final matchedPeople = <BiblePerson>[];
  for (final verse in verses) {
    for (final match in _findPersonMatches(verse.text, verse.id, people)) {
      if (ids.add(match.person.id)) {
        matchedPeople.add(match.person);
      }
    }
  }

  return matchedPeople;
}

List<_PersonMatch> _findPersonMatches(
  String text,
  String verseId,
  List<BiblePerson> people,
) {
  if (text.isEmpty || people.isEmpty) {
    return const [];
  }

  final candidates = <_AliasCandidate>[];
  for (final person in people) {
    for (final alias in person.verseAliases[verseId] ?? const <String>[]) {
      if (alias.isEmpty) {
        continue;
      }
      candidates.add(
        _AliasCandidate(person: person, alias: alias, isVerseAlias: true),
      );
    }
    for (final alias in person.aliases) {
      if (alias.isEmpty) {
        continue;
      }
      candidates.add(_AliasCandidate(person: person, alias: alias));
    }
  }
  candidates.sort((a, b) {
    final priority = b.priority.compareTo(a.priority);
    if (priority != 0) {
      return priority;
    }
    return b.alias.length.compareTo(a.alias.length);
  });

  final lowerText = text.toLowerCase();
  final matches = <_PersonMatch>[];
  var index = 0;
  while (index < text.length) {
    _PersonMatch? found;
    for (final candidate in candidates) {
      final lowerAlias = candidate.alias.toLowerCase();
      if (!lowerText.startsWith(lowerAlias, index)) {
        continue;
      }
      final end = index + candidate.alias.length;
      if (_needsWordBoundary(candidate.alias) &&
          !_hasWordBoundary(lowerText, index, end)) {
        continue;
      }
      found = _PersonMatch(person: candidate.person, start: index, end: end);
      break;
    }

    if (found == null) {
      index += 1;
      continue;
    }

    matches.add(found);
    index = found.end;
  }

  return matches;
}

bool _needsWordBoundary(String alias) {
  return alias.runes.any(_isAsciiLetterOrDigit);
}

bool _hasWordBoundary(String text, int start, int end) {
  final before = start <= 0 ? null : text.codeUnitAt(start - 1);
  final after = end >= text.length ? null : text.codeUnitAt(end);
  return (before == null || !_isAsciiLetterOrDigit(before)) &&
      (after == null || !_isAsciiLetterOrDigit(after));
}

bool _isAsciiLetterOrDigit(int rune) {
  return (rune >= 0x30 && rune <= 0x39) ||
      (rune >= 0x41 && rune <= 0x5A) ||
      (rune >= 0x61 && rune <= 0x7A);
}

class _AliasCandidate {
  const _AliasCandidate({
    required this.person,
    required this.alias,
    this.isVerseAlias = false,
  });

  final BiblePerson person;
  final String alias;
  final bool isVerseAlias;

  int get priority => isVerseAlias ? 1 : 0;
}

class _PersonMatch {
  const _PersonMatch({
    required this.person,
    required this.start,
    required this.end,
  });

  final BiblePerson person;
  final int start;
  final int end;
}
