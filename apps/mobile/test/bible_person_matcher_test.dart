import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/study/domain/bible_person.dart';
import 'package:mbc_walkwith/features/study/domain/bible_person_matcher.dart';
import 'package:mbc_walkwith/features/study/domain/bible_verse.dart';

void main() {
  test('chapter people are deduplicated in first-appearance order', () {
    const jesus = BiblePerson(
      id: 'jesus',
      name: 'Jesus',
      role: 'Messiah',
      summary: 'Central person of the New Testament.',
      description: 'Central person of the New Testament.',
      sections: [
        BiblePersonSection(
          type: 'overview',
          title: 'Overview',
          body: 'Central person of the New Testament.',
        ),
      ],
      aliases: ['Jesus'],
      verseAliases: {},
      relatedVerseIds: [],
    );
    const mary = BiblePerson(
      id: 'mary_mother',
      name: 'Mary',
      role: 'Mother of Jesus',
      summary: 'Mother of Jesus.',
      description: 'Mother of Jesus.',
      sections: [
        BiblePersonSection(
          type: 'overview',
          title: 'Overview',
          body: 'Mother of Jesus.',
        ),
      ],
      aliases: ['Mary mother of Jesus'],
      verseAliases: {
        'mat.1.18': ['Mary'],
      },
      relatedVerseIds: [],
    );

    final people = findUniqueBiblePeopleInChapter(
      verses: const [
        BibleVerse(id: 'mat.1.18', number: 18, text: 'Mary was engaged.'),
        BibleVerse(
          id: 'mat.1.21',
          number: 21,
          text: 'You shall call him Jesus.',
        ),
        BibleVerse(id: 'mat.1.25', number: 25, text: 'He named him Jesus.'),
      ],
      people: const [jesus, mary],
    );

    expect(people.map((person) => person.id), ['mary_mother', 'jesus']);
  });
}
