List<String> searchTokens(String query) {
  return query
      .split(RegExp(r'\s+'))
      .map(normalizeSearchText)
      .where((token) => token.length >= 2)
      .toList(growable: false);
}

double scoreBibleSearchResult({
  required String normalizedQuery,
  required List<String> tokens,
  required String verseText,
}) {
  final normalizedVerse = normalizeSearchText(verseText);
  if (normalizedVerse.isEmpty) {
    return 0;
  }

  if (normalizedVerse.contains(normalizedQuery)) {
    final start = normalizedVerse.indexOf(normalizedQuery);
    return 1000 + normalizedQuery.length - (start * 0.01);
  }

  var score = 0.0;
  if (tokens.isNotEmpty) {
    var hits = 0;
    var hitLength = 0;
    for (final token in tokens) {
      if (normalizedVerse.contains(token)) {
        hits += 1;
        hitLength += token.length;
      }
    }
    if (hits > 0) {
      score += 420 * (hits / tokens.length) + hitLength;
    }
  }

  final orderedCoverage = _orderedCoverage(normalizedQuery, normalizedVerse);
  if (orderedCoverage >= 0.74) {
    score += 180 * orderedCoverage;
  }

  final overlap = _uniqueRuneOverlap(normalizedQuery, normalizedVerse);
  if (overlap >= 0.58) {
    score += 80 * overlap;
  }

  return score >= 80 ? score : 0;
}

String normalizeSearchText(String value) {
  final buffer = StringBuffer();
  for (final rune in value.runes) {
    if (_isSearchRune(rune)) {
      buffer.write(String.fromCharCode(rune).toLowerCase());
    }
  }
  return buffer.toString();
}

bool _isSearchRune(int rune) {
  final isAsciiDigit = rune >= 0x30 && rune <= 0x39;
  final isAsciiUpper = rune >= 0x41 && rune <= 0x5A;
  final isAsciiLower = rune >= 0x61 && rune <= 0x7A;
  final isCjk =
      (rune >= 0x3400 && rune <= 0x4DBF) ||
      (rune >= 0x4E00 && rune <= 0x9FFF) ||
      (rune >= 0xF900 && rune <= 0xFAFF);
  return isAsciiDigit || isAsciiUpper || isAsciiLower || isCjk;
}

double _orderedCoverage(String needle, String haystack) {
  if (needle.isEmpty || haystack.isEmpty) {
    return 0;
  }

  final needleRunes = needle.runes.toList(growable: false);
  var matched = 0;
  for (final rune in haystack.runes) {
    if (matched >= needleRunes.length) {
      break;
    }
    if (rune == needleRunes[matched]) {
      matched += 1;
    }
  }
  return matched / needleRunes.length;
}

double _uniqueRuneOverlap(String needle, String haystack) {
  if (needle.isEmpty || haystack.isEmpty) {
    return 0;
  }

  final needleRunes = needle.runes.toSet();
  final haystackRunes = haystack.runes.toSet();
  final overlap = needleRunes.where(haystackRunes.contains).length;
  return overlap / needleRunes.length;
}
