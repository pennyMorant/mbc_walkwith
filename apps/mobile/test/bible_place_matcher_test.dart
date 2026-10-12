import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/domain/bible_place.dart';
import 'package:mbc_walkwith/features/study/domain/bible_place_matcher.dart';
import 'package:mbc_walkwith/features/study/domain/bible_verse.dart';

void main() {
  test('chapter places are deduplicated in first-appearance order', () {
    const bethlehem = BiblePlace(
      id: 'bethlehem',
      name: 'Bethlehem',
      category: 'Town',
      summary: 'Town in Judea.',
      description: 'Town in Judea.',
      sections: [
        BiblePlaceSection(
          type: 'overview',
          title: 'Overview',
          body: 'Town in Judea.',
        ),
      ],
      aliases: ['Bethlehem'],
      verseAliases: {},
    );
    const rome = BiblePlace(
      id: 'rome',
      name: 'Rome',
      category: 'City',
      summary: 'Imperial capital.',
      description: 'Imperial capital.',
      sections: [
        BiblePlaceSection(
          type: 'overview',
          title: 'Overview',
          body: 'Imperial capital.',
        ),
      ],
      aliases: ['Rome'],
      verseAliases: {},
    );

    final places = findUniqueBiblePlacesInChapter(
      verses: const [
        BibleVerse(
          id: 'mat.2.1',
          number: 1,
          text: 'Jesus was born in Bethlehem of Judea.',
        ),
        BibleVerse(
          id: 'rom.1.7',
          number: 7,
          text: 'To all who are in Rome. Romans is not a place match.',
        ),
        BibleVerse(id: 'mat.2.5', number: 5, text: 'In Bethlehem of Judea.'),
      ],
      places: const [rome, bethlehem],
    );

    expect(places.map((place) => place.id), ['bethlehem', 'rome']);
  });
}
