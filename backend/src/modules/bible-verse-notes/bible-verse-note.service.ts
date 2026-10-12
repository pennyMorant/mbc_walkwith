import type {
  AdminBibleVerseNoteHideRequest,
  AdminBibleVerseNoteListQuery,
  BibleVerseNoteCreateRequest,
  BibleVerseNoteListQuery,
  BibleVerseNoteUpdateRequest
} from "@mbc/api-contracts";

import {
  bibleVerseNoteAuthorRequired,
  bibleVerseNoteNotFound,
  bibleVerseNotePermissionDenied,
  bibleVerseNoteVerseInvalid
} from "./bible-verse-note-errors.js";
import type {
  BibleVerseNoteAuthor,
  BibleVerseNoteRepository
} from "./bible-verse-note.repository.js";

export class BibleVerseNoteService {
  constructor(private readonly repository: BibleVerseNoteRepository) {}

  listPublished(query: BibleVerseNoteListQuery, viewer?: BibleVerseNoteAuthor) {
    return this.repository.listPublished(query, viewer ?? null);
  }

  listAdmin(query: AdminBibleVerseNoteListQuery) {
    return this.repository.listAdmin(query);
  }

  async create(input: BibleVerseNoteCreateRequest, author: BibleVerseNoteAuthor) {
    validateVerseReference(input);
    return this.repository.create({ ...input, author });
  }

  async update(
    id: string,
    input: BibleVerseNoteUpdateRequest,
    author: BibleVerseNoteAuthor
  ) {
    const result = await this.repository.updateOwned(id, input, author);
    if (result === "not_found") {
      throw bibleVerseNoteNotFound(id);
    }
    if (result === "permission_denied") {
      throw bibleVerseNotePermissionDenied(id);
    }
    return result;
  }

  async delete(id: string, author: BibleVerseNoteAuthor) {
    const result = await this.repository.deleteOwned(id, author);
    if (result === "not_found") {
      throw bibleVerseNoteNotFound(id);
    }
    if (result === "permission_denied") {
      throw bibleVerseNotePermissionDenied(id);
    }
    return { deleted: true };
  }

  async hide(
    id: string,
    input: AdminBibleVerseNoteHideRequest,
    hiddenByAdminUserId?: string | null
  ) {
    const note = await this.repository.hide(id, {
      ...(input.hiddenReason !== undefined
        ? { hiddenReason: input.hiddenReason }
        : {}),
      ...(hiddenByAdminUserId !== undefined ? { hiddenByAdminUserId } : {})
    });
    if (!note) {
      throw bibleVerseNoteNotFound(id);
    }
    return note;
  }

  async restore(id: string) {
    const note = await this.repository.restore(id);
    if (!note) {
      throw bibleVerseNoteNotFound(id);
    }
    return note;
  }
}

export function requireVerseNoteAuthor(author?: BibleVerseNoteAuthor | null) {
  if (!author) {
    throw bibleVerseNoteAuthorRequired();
  }
  return author;
}

function validateVerseReference(input: BibleVerseNoteCreateRequest) {
  const expectedPrefix = `${input.bookId}.${input.chapter}.`;
  if (
    !input.verseId.startsWith(expectedPrefix) ||
    input.verseId !== `${input.bookId}.${input.chapter}.${input.verse}`
  ) {
    throw bibleVerseNoteVerseInvalid(input.verseId);
  }
}
