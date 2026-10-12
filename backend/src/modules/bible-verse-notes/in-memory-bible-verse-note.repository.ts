import type {
  AdminBibleVerseNote,
  AdminBibleVerseNoteListQuery,
  BibleVerseNote,
  BibleVerseNoteListQuery,
  BibleVerseNoteUpdateRequest
} from "@mbc/api-contracts";
import { randomUUID } from "node:crypto";

import type {
  BibleVerseNoteAuthor,
  BibleVerseNoteCreateRecord,
  BibleVerseNoteRepository
} from "./bible-verse-note.repository.js";

export class InMemoryBibleVerseNoteRepository
  implements BibleVerseNoteRepository
{
  private notes = new Map<string, AdminBibleVerseNote>();

  async listPublished(
    query: BibleVerseNoteListQuery,
    viewer?: BibleVerseNoteAuthor | null
  ): Promise<BibleVerseNote[]> {
    return [...this.notes.values()]
      .filter((note) => note.status === "published")
      .filter((note) => note.verseId === query.verseId)
      .sort(sortNewestFirst)
      .slice(0, query.limit)
      .map((note) => publicNoteFromAdmin(note, viewer));
  }

  async listAdmin(
    query: AdminBibleVerseNoteListQuery
  ): Promise<AdminBibleVerseNote[]> {
    const search = query.query?.trim().toLowerCase();
    return [...this.notes.values()]
      .filter((note) => {
        if (query.status) {
          if (note.status !== query.status) {
            return false;
          }
        } else if (note.status === "deleted") {
          return false;
        }
        if (query.authorType && note.authorType !== query.authorType) {
          return false;
        }
        if (query.verseId && note.verseId !== query.verseId) {
          return false;
        }
        if (search) {
          return [
            note.verseId,
            note.content,
            note.authorDisplayName,
            note.externalUserId ?? "",
            note.hiddenReason ?? ""
          ]
            .join(" ")
            .toLowerCase()
            .includes(search);
        }
        return true;
      })
      .sort(sortNewestFirst)
      .slice(0, query.limit);
  }

  async getAdminById(id: string): Promise<AdminBibleVerseNote | null> {
    return this.notes.get(id) ?? null;
  }

  async create(input: BibleVerseNoteCreateRecord): Promise<BibleVerseNote> {
    const now = new Date().toISOString();
    const note: AdminBibleVerseNote = {
      id: randomUUID(),
      verseId: input.verseId,
      bookId: input.bookId,
      chapter: input.chapter,
      verse: input.verse,
      content: input.content.trim(),
      authorType: input.author.type,
      authorDisplayName: displayNameForAuthor(input.author),
      isMine: true,
      memberUserId:
        input.author.type === "member" ? input.author.memberUserId : null,
      externalUserId:
        input.author.type === "external" ? input.author.externalUserId : null,
      externalDisplayName:
        input.author.type === "external" ? input.author.displayName : null,
      status: "published",
      hiddenAt: null,
      hiddenByAdminUserId: null,
      hiddenReason: null,
      createdAt: now,
      updatedAt: now
    };
    this.notes.set(note.id, note);
    return publicNoteFromAdmin(note, input.author);
  }

  async updateOwned(
    id: string,
    input: BibleVerseNoteUpdateRequest,
    author: BibleVerseNoteAuthor
  ): Promise<BibleVerseNote | "not_found" | "permission_denied"> {
    const existing = this.notes.get(id);
    if (!existing || existing.status !== "published") {
      return "not_found";
    }
    if (!isOwnedBy(existing, author)) {
      return "permission_denied";
    }
    const updated: AdminBibleVerseNote = {
      ...existing,
      content: input.content.trim(),
      status: "published",
      updatedAt: new Date().toISOString()
    };
    this.notes.set(id, updated);
    return publicNoteFromAdmin(updated, author);
  }

  async deleteOwned(
    id: string,
    author: BibleVerseNoteAuthor
  ): Promise<"deleted" | "not_found" | "permission_denied"> {
    const existing = this.notes.get(id);
    if (!existing || existing.status === "deleted") {
      return "not_found";
    }
    if (!isOwnedBy(existing, author)) {
      return "permission_denied";
    }
    this.notes.set(id, {
      ...existing,
      status: "deleted",
      updatedAt: new Date().toISOString()
    });
    return "deleted";
  }

  async hide(
    id: string,
    input: { hiddenReason?: string; hiddenByAdminUserId?: string | null }
  ): Promise<AdminBibleVerseNote | null> {
    const existing = this.notes.get(id);
    if (!existing || existing.status !== "published") {
      return null;
    }
    const updated: AdminBibleVerseNote = {
      ...existing,
      status: "hidden",
      hiddenAt: new Date().toISOString(),
      hiddenByAdminUserId: input.hiddenByAdminUserId ?? null,
      hiddenReason: input.hiddenReason ?? "",
      updatedAt: new Date().toISOString()
    };
    this.notes.set(id, updated);
    return updated;
  }

  async restore(id: string): Promise<AdminBibleVerseNote | null> {
    const existing = this.notes.get(id);
    if (!existing || existing.status !== "hidden") {
      return null;
    }
    const updated: AdminBibleVerseNote = {
      ...existing,
      status: "published",
      hiddenAt: null,
      hiddenByAdminUserId: null,
      hiddenReason: null,
      updatedAt: new Date().toISOString()
    };
    this.notes.set(id, updated);
    return updated;
  }
}

function publicNoteFromAdmin(
  note: AdminBibleVerseNote,
  viewer?: BibleVerseNoteAuthor | null
): BibleVerseNote {
  return {
    id: note.id,
    verseId: note.verseId,
    bookId: note.bookId,
    chapter: note.chapter,
    verse: note.verse,
    content: note.content,
    authorType: note.authorType,
    authorDisplayName: note.authorDisplayName,
    isMine: viewer ? isOwnedBy(note, viewer) : false,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
}

function isOwnedBy(note: AdminBibleVerseNote, author: BibleVerseNoteAuthor) {
  if (author.type === "member") {
    return note.memberUserId === author.memberUserId;
  }
  return note.externalUserId === author.externalUserId;
}

function displayNameForAuthor(author: BibleVerseNoteAuthor) {
  const clean = author.displayName.trim();
  return clean.length > 0 ? clean : "访客";
}

function sortNewestFirst(a: AdminBibleVerseNote, b: AdminBibleVerseNote) {
  return b.createdAt.localeCompare(a.createdAt);
}
