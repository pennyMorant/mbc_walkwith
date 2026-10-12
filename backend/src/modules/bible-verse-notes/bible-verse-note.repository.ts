import type {
  AdminBibleVerseNote,
  AdminBibleVerseNoteListQuery,
  BibleVerseNote,
  BibleVerseNoteCreateRequest,
  BibleVerseNoteListQuery,
  BibleVerseNoteUpdateRequest
} from "@mbc/api-contracts";

export type BibleVerseNoteAuthor =
  | {
      type: "member";
      memberUserId: string;
      displayName: string;
    }
  | {
      type: "external";
      externalUserId: string;
      displayName: string;
    };

export type BibleVerseNoteCreateRecord = BibleVerseNoteCreateRequest & {
  author: BibleVerseNoteAuthor;
};

export interface BibleVerseNoteRepository {
  listPublished(
    query: BibleVerseNoteListQuery,
    viewer?: BibleVerseNoteAuthor | null
  ): Promise<BibleVerseNote[]>;
  listAdmin(query: AdminBibleVerseNoteListQuery): Promise<AdminBibleVerseNote[]>;
  getAdminById(id: string): Promise<AdminBibleVerseNote | null>;
  create(input: BibleVerseNoteCreateRecord): Promise<BibleVerseNote>;
  updateOwned(
    id: string,
    input: BibleVerseNoteUpdateRequest,
    author: BibleVerseNoteAuthor
  ): Promise<BibleVerseNote | "not_found" | "permission_denied">;
  deleteOwned(
    id: string,
    author: BibleVerseNoteAuthor
  ): Promise<"deleted" | "not_found" | "permission_denied">;
  hide(
    id: string,
    input: { hiddenReason?: string; hiddenByAdminUserId?: string | null }
  ): Promise<AdminBibleVerseNote | null>;
  restore(id: string): Promise<AdminBibleVerseNote | null>;
}
