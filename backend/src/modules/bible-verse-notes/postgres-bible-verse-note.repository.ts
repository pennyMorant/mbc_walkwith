import type {
  AdminBibleVerseNote,
  AdminBibleVerseNoteListQuery,
  BibleVerseNote,
  BibleVerseNoteListQuery,
  BibleVerseNoteUpdateRequest
} from "@mbc/api-contracts";
import { and, desc, eq, ilike, ne, or } from "drizzle-orm";

import type { AppDb } from "../../shared/db/client.js";
import { bibleVerseNotes } from "../../shared/db/schema.js";
import type {
  BibleVerseNoteAuthor,
  BibleVerseNoteCreateRecord,
  BibleVerseNoteRepository
} from "./bible-verse-note.repository.js";

export class PostgresBibleVerseNoteRepository
  implements BibleVerseNoteRepository
{
  constructor(private readonly db: AppDb) {}

  async listPublished(
    query: BibleVerseNoteListQuery,
    viewer?: BibleVerseNoteAuthor | null
  ): Promise<BibleVerseNote[]> {
    const rows = await this.db
      .select()
      .from(bibleVerseNotes)
      .where(
        and(
          eq(bibleVerseNotes.status, "published"),
          eq(bibleVerseNotes.verseId, query.verseId)
        )
      )
      .orderBy(desc(bibleVerseNotes.createdAt))
      .limit(query.limit);
    return rows.map((row) => publicNoteFromRow(row, viewer));
  }

  async listAdmin(
    query: AdminBibleVerseNoteListQuery
  ): Promise<AdminBibleVerseNote[]> {
    const filters = [
      query.status
        ? eq(bibleVerseNotes.status, query.status)
        : ne(bibleVerseNotes.status, "deleted"),
      query.authorType
        ? eq(bibleVerseNotes.authorType, query.authorType)
        : undefined,
      query.verseId ? eq(bibleVerseNotes.verseId, query.verseId) : undefined,
      query.query
        ? or(
            ilike(bibleVerseNotes.verseId, `%${query.query}%`),
            ilike(bibleVerseNotes.content, `%${query.query}%`),
            ilike(bibleVerseNotes.externalDisplayName, `%${query.query}%`),
            ilike(bibleVerseNotes.externalUserId, `%${query.query}%`),
            ilike(bibleVerseNotes.hiddenReason, `%${query.query}%`)
          )
        : undefined
    ].filter((filter) => filter !== undefined);

    const rows = await this.db
      .select()
      .from(bibleVerseNotes)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(bibleVerseNotes.createdAt))
      .limit(query.limit);
    return rows.map(adminNoteFromRow);
  }

  async getAdminById(id: string): Promise<AdminBibleVerseNote | null> {
    const [row] = await this.db
      .select()
      .from(bibleVerseNotes)
      .where(eq(bibleVerseNotes.id, id))
      .limit(1);
    return row ? adminNoteFromRow(row) : null;
  }

  async create(input: BibleVerseNoteCreateRecord): Promise<BibleVerseNote> {
    const [row] = await this.db
      .insert(bibleVerseNotes)
      .values({
        verseId: input.verseId,
        bookId: input.bookId,
        chapter: input.chapter,
        verse: input.verse,
        content: input.content.trim(),
        authorType: input.author.type,
        authorDisplayName: displayNameForAuthor(input.author),
        memberUserId:
          input.author.type === "member" ? input.author.memberUserId : null,
        externalUserId:
          input.author.type === "external" ? input.author.externalUserId : null,
        externalDisplayName:
          input.author.type === "external" ? input.author.displayName : null,
        status: "published",
        updatedAt: new Date()
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create Bible verse note.");
    }
    return publicNoteFromRow(row, input.author);
  }

  async updateOwned(
    id: string,
    input: BibleVerseNoteUpdateRequest,
    author: BibleVerseNoteAuthor
  ): Promise<BibleVerseNote | "not_found" | "permission_denied"> {
    const ownerCondition =
      author.type === "member"
        ? eq(bibleVerseNotes.memberUserId, author.memberUserId)
        : eq(bibleVerseNotes.externalUserId, author.externalUserId);
    const [row] = await this.db
      .update(bibleVerseNotes)
      .set({
        content: input.content.trim(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(bibleVerseNotes.id, id),
          eq(bibleVerseNotes.status, "published"),
          ownerCondition
        )
      )
      .returning();
    if (row) {
      return publicNoteFromRow(row, author);
    }

    const existing = await this.getAdminById(id);
    if (!existing || existing.status !== "published") {
      return "not_found";
    }
    return isOwnedBy(existing, author) ? "not_found" : "permission_denied";
  }

  async deleteOwned(
    id: string,
    author: BibleVerseNoteAuthor
  ): Promise<"deleted" | "not_found" | "permission_denied"> {
    const existing = await this.getAdminById(id);
    if (!existing || existing.status === "deleted") {
      return "not_found";
    }
    if (!isOwnedBy(existing, author)) {
      return "permission_denied";
    }
    await this.db
      .update(bibleVerseNotes)
      .set({ status: "deleted", updatedAt: new Date() })
      .where(eq(bibleVerseNotes.id, id));
    return "deleted";
  }

  async hide(
    id: string,
    input: { hiddenReason?: string; hiddenByAdminUserId?: string | null }
  ): Promise<AdminBibleVerseNote | null> {
    const [row] = await this.db
      .update(bibleVerseNotes)
      .set({
        status: "hidden",
        hiddenAt: new Date(),
        hiddenByAdminUserId: input.hiddenByAdminUserId ?? null,
        hiddenReason: input.hiddenReason ?? "",
        updatedAt: new Date()
      })
      .where(and(eq(bibleVerseNotes.id, id), eq(bibleVerseNotes.status, "published")))
      .returning();
    return row ? adminNoteFromRow(row) : null;
  }

  async restore(id: string): Promise<AdminBibleVerseNote | null> {
    const [row] = await this.db
      .update(bibleVerseNotes)
      .set({
        status: "published",
        hiddenAt: null,
        hiddenByAdminUserId: null,
        hiddenReason: null,
        updatedAt: new Date()
      })
      .where(and(eq(bibleVerseNotes.id, id), eq(bibleVerseNotes.status, "hidden")))
      .returning();
    return row ? adminNoteFromRow(row) : null;
  }
}

type BibleVerseNoteRow = typeof bibleVerseNotes.$inferSelect;

function publicNoteFromRow(
  row: BibleVerseNoteRow,
  viewer?: BibleVerseNoteAuthor | null
): BibleVerseNote {
  return {
    id: row.id,
    verseId: row.verseId,
    bookId: row.bookId,
    chapter: row.chapter,
    verse: row.verse,
    content: row.content,
    authorType: row.authorType,
    authorDisplayName: authorDisplayNameFromRow(row),
    isMine: viewer ? isOwnedBy(adminNoteFromRow(row), viewer) : false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function adminNoteFromRow(row: BibleVerseNoteRow): AdminBibleVerseNote {
  return {
    ...publicNoteFromRow(row, null),
    isMine: false,
    status: row.status,
    memberUserId: row.memberUserId,
    externalUserId: row.externalUserId,
    externalDisplayName: row.externalDisplayName,
    hiddenAt: row.hiddenAt?.toISOString() ?? null,
    hiddenByAdminUserId: row.hiddenByAdminUserId,
    hiddenReason: row.hiddenReason
  };
}

function isOwnedBy(note: AdminBibleVerseNote, author: BibleVerseNoteAuthor) {
  if (author.type === "member") {
    return note.memberUserId === author.memberUserId;
  }
  return note.externalUserId === author.externalUserId;
}

function authorDisplayNameFromRow(row: BibleVerseNoteRow) {
  const name = row.authorDisplayName?.trim();
  return name && name.length > 0 ? name : "访客";
}

function displayNameForAuthor(author: BibleVerseNoteAuthor) {
  const clean = author.displayName.trim();
  return clean.length > 0 ? clean : "访客";
}
