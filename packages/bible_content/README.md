# Bible Content

This package stores source Bible content and normalized artifacts shared by the
mobile app, backend, and other first-party clients.

## Layout

```text
packages/bible_content/
  sources/
    web/
      metadata.json
      raw/
        engwebp_usfm.zip
      licenses/
        copyright.html
        license.md
      normalized/
        book_mappings.json
        books.json
        chapters.jsonl
        index.json
        verses.jsonl
    cuvs/
      metadata.json
      raw/
      licenses/
      normalized/
    cuvt/
      metadata.json
      raw/
      licenses/
      normalized/
  tools/
    normalize_web_usfm.dart
```

## Source Rules

- Keep original downloaded files under `sources/<version>/raw/`.
- Keep copyright and license material under `sources/<version>/licenses/`.
- Generated normalized files belong under `sources/<version>/normalized/`.
- Do not edit Bible source text manually.
- If a source text is corrected or updated, record the new source URL, date, and checksum in `metadata.json`.

## Current Sources

```text
versionId: web
sourceId: engwebp
name: World English Bible
language: en
bookSet: 66-book protocanon
format: USFM
license: Public Domain

versionId: cuvs
sourceId: cmn-cu89s
name: Chinese Union Version, Simplified
language: zh-Hans
bookSet: 66-book protocanon
format: USFM
license: Public Domain

versionId: cuvt
sourceId: cmn-cu89t
name: Chinese Union Version, Traditional
language: zh-Hant
bookSet: 66-book protocanon
format: USFM
license: Public Domain
```

The "World English Bible" name is a trademark of eBible.org. If the text is changed, the changed text must not be called World English Bible.

## Normalized Mapping

Run the normalizer from the repository root:

```bash
dart packages/bible_content/tools/normalize_web_usfm.dart
```

The generated IDs are stable and should be used by the mobile app, backend, sermons, AI explanation records, bookmarks, highlights, and reading progress.

```text
versionId: web | cuvs | cuvt
bookId: rom
chapterId: rom.8
verseId: rom.8.28
```

Generated outputs:

```text
normalized/index.json
  Summary counts and output names.

normalized/books.json
  One object per Bible book. Includes `bookId`, `usfmId`, `osisId`, testament,
  category, canonical order, localized names, abbreviations, and chapter count.

normalized/book_mappings.json
  Alias table for resolving names such as `Romans`, `Rom`, `ROM`, `罗马书`,
  and canonical order values to the stable `bookId`.

normalized/chapters.jsonl
  One JSON object per chapter. `id` is `<bookId>.<chapter>`.

normalized/verses.jsonl
  One JSON object per source verse marker. `id` is
  `<bookId>.<chapter>.<verse>`.
```

Current normalization counts:

```text
web:
  books: 66
  chapters: 1189
  source verse markers: 31103
  empty verse markers: 5

cuvs:
  books: 66
  chapters: 1189
  source verse markers: 31021

cuvt:
  books: 66
  chapters: 1189
  source verse markers: 31021
```

The source includes five empty verse markers:

```text
luk.17.36
act.8.37
act.15.34
act.24.7
rom.16.25
```

These are preserved with `isEmpty: true` and `text: ""` so cross-reference and verse-number mapping remains stable.
