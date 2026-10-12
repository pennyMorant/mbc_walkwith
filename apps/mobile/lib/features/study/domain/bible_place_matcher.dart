import 'bible_place.dart';
import 'bible_verse.dart';

List<BiblePlace> findUniqueBiblePlacesInChapter({
  required List<BibleVerse> verses,
  required List<BiblePlace> places,
}) {
  if (verses.isEmpty || places.isEmpty) {
    return const [];
  }

  final ids = <String>{};
  final matchedPlaces = <BiblePlace>[];
  for (final verse in verses) {
    for (final match in _findPlaceMatches(verse.text, verse.id, places)) {
      if (ids.add(match.place.id)) {
        matchedPlaces.add(match.place);
      }
    }
  }

  return matchedPlaces;
}

List<_PlaceMatch> _findPlaceMatches(
  String text,
  String verseId,
  List<BiblePlace> places,
) {
  if (text.isEmpty || places.isEmpty) {
    return const [];
  }

  final candidates = <_AliasCandidate>[];
  for (final place in places) {
    for (final alias in place.verseAliases[verseId] ?? const <String>[]) {
      if (alias.isEmpty) {
        continue;
      }
      candidates.add(
        _AliasCandidate(place: place, alias: alias, isVerseAlias: true),
      );
    }
    for (final alias in place.aliases) {
      if (alias.isEmpty) {
        continue;
      }
      candidates.add(_AliasCandidate(place: place, alias: alias));
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
  final matches = <_PlaceMatch>[];
  var index = 0;
  while (index < text.length) {
    _PlaceMatch? found;
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
      found = _PlaceMatch(place: candidate.place, start: index, end: end);
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
    required this.place,
    required this.alias,
    this.isVerseAlias = false,
  });

  final BiblePlace place;
  final String alias;
  final bool isVerseAlias;

  int get priority => isVerseAlias ? 1 : 0;
}

class _PlaceMatch {
  const _PlaceMatch({
    required this.place,
    required this.start,
    required this.end,
  });

  final BiblePlace place;
  final int start;
  final int end;
}
