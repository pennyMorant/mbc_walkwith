import { z } from "zod";

export const bibleVerseNoteAuthorTypeSchema = z.enum(["member", "external"]);
export const bibleVerseNoteStatusSchema = z.enum([
  "published",
  "hidden",
  "deleted"
]);

export const bibleVerseNoteSchema = z.object({
  id: z.string(),
  verseId: z.string(),
  bookId: z.string(),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  content: z.string(),
  authorType: bibleVerseNoteAuthorTypeSchema,
  authorDisplayName: z.string(),
  isMine: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const adminBibleVerseNoteSchema = bibleVerseNoteSchema.extend({
  status: bibleVerseNoteStatusSchema,
  memberUserId: z.string().nullable(),
  externalUserId: z.string().nullable(),
  externalDisplayName: z.string().nullable(),
  hiddenAt: z.string().nullable(),
  hiddenByAdminUserId: z.string().nullable(),
  hiddenReason: z.string().nullable()
});

export const bibleVerseNoteListQuerySchema = z.object({
  verseId: z.string().trim().min(3).max(40),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const adminBibleVerseNoteListQuerySchema = z.object({
  query: z.string().trim().max(200).optional(),
  verseId: z.string().trim().min(3).max(40).optional(),
  status: bibleVerseNoteStatusSchema.optional(),
  authorType: bibleVerseNoteAuthorTypeSchema.optional(),
  limit: z.coerce.number().int().positive().max(200).default(100)
});

export const bibleVerseNoteCreateRequestSchema = z.object({
  verseId: z.string().trim().min(3).max(40),
  bookId: z.string().trim().min(2).max(20),
  chapter: z.number().int().positive().max(200),
  verse: z.number().int().positive().max(200),
  content: z.string().trim().min(1).max(2000),
  externalDisplayName: z.string().trim().max(80).optional()
});

export const bibleVerseNoteUpdateRequestSchema = z.object({
  content: z.string().trim().min(1).max(2000)
});

export const adminBibleVerseNoteHideRequestSchema = z.object({
  hiddenReason: z.string().trim().max(500).optional()
});

export const bibleVerseNoteListResponseSchema = z.object({
  items: z.array(bibleVerseNoteSchema)
});

export const adminBibleVerseNoteListResponseSchema = z.object({
  items: z.array(adminBibleVerseNoteSchema)
});

export type BibleVerseNoteAuthorType = z.infer<
  typeof bibleVerseNoteAuthorTypeSchema
>;
export type BibleVerseNoteStatus = z.infer<typeof bibleVerseNoteStatusSchema>;
export type BibleVerseNote = z.infer<typeof bibleVerseNoteSchema>;
export type AdminBibleVerseNote = z.infer<typeof adminBibleVerseNoteSchema>;
export type BibleVerseNoteListQuery = z.infer<
  typeof bibleVerseNoteListQuerySchema
>;
export type AdminBibleVerseNoteListQuery = z.infer<
  typeof adminBibleVerseNoteListQuerySchema
>;
export type BibleVerseNoteCreateRequest = z.infer<
  typeof bibleVerseNoteCreateRequestSchema
>;
export type BibleVerseNoteUpdateRequest = z.infer<
  typeof bibleVerseNoteUpdateRequestSchema
>;
export type AdminBibleVerseNoteHideRequest = z.infer<
  typeof adminBibleVerseNoteHideRequestSchema
>;
