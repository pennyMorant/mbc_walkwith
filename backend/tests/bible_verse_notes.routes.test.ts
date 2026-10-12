import {
  auditLogListResponseSchema,
  adminBibleVerseNoteListResponseSchema,
  bibleVerseNoteListResponseSchema,
  bibleVerseNoteSchema,
  deletedResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, test } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("Bible verse notes routes", () => {
  test("allows external users to share and manage verse notes", async () => {
    const { app, close } = await buildTestApp();
    try {
      const createResponse = await app.inject({
        method: "POST",
        url: "/v1/bible/verse-notes",
        headers: { "x-external-user-id": "ext_test_reader" },
        payload: {
          verseId: "rom.8.28",
          bookId: "rom",
          chapter: 8,
          verse: 28,
          content: "This verse reminds me to trust God.",
          externalDisplayName: "Guest Reader"
        }
      });
      expect(createResponse.statusCode).toBe(200);
      const created = expectResponseData(
        createResponse,
        bibleVerseNoteSchema,
        "create bible verse note"
      );
      expect(created.isMine).toBe(true);
      expect(created.authorType).toBe("external");
      expect(created.authorDisplayName).toBe("Guest Reader");

      const listResponse = await app.inject({
        method: "GET",
        url: "/v1/bible/verse-notes?verseId=rom.8.28",
        headers: { "x-external-user-id": "ext_test_reader" }
      });
      expect(listResponse.statusCode).toBe(200);
      const list = expectResponseData(
        listResponse,
        bibleVerseNoteListResponseSchema,
        "list bible verse notes"
      );
      expect(list.items).toHaveLength(1);
      expect(list.items[0]?.isMine).toBe(true);

      const deniedResponse = await app.inject({
        method: "PATCH",
        url: `/v1/bible/verse-notes/${created.id}`,
        headers: { "x-external-user-id": "ext_other_reader" },
        payload: { content: "Trying to edit someone else's note." }
      });
      expect(deniedResponse.statusCode).toBe(403);

      const updateResponse = await app.inject({
        method: "PATCH",
        url: `/v1/bible/verse-notes/${created.id}`,
        headers: { "x-external-user-id": "ext_test_reader" },
        payload: { content: "Updated reflection." }
      });
      expect(updateResponse.statusCode).toBe(200);
      const updated = expectResponseData(
        updateResponse,
        bibleVerseNoteSchema,
        "update bible verse note"
      );
      expect(updated.content).toBe("Updated reflection.");

      const deleteResponse = await app.inject({
        method: "DELETE",
        url: `/v1/bible/verse-notes/${created.id}`,
        headers: { "x-external-user-id": "ext_test_reader" }
      });
      expect(deleteResponse.statusCode).toBe(200);
      expectResponseData(deleteResponse, deletedResponseSchema, "delete note");

      const publicListAfterDeleteResponse = await app.inject({
        method: "GET",
        url: "/v1/bible/verse-notes?verseId=rom.8.28",
        headers: { "x-external-user-id": "ext_test_reader" }
      });
      const publicListAfterDelete = expectResponseData(
        publicListAfterDeleteResponse,
        bibleVerseNoteListResponseSchema,
        "public list after delete"
      );
      expect(publicListAfterDelete.items).toHaveLength(0);

      const admin = await login(app);
      const adminListResponse = await app.inject({
        method: "GET",
        url: "/v1/admin/bible/verse-notes?verseId=rom.8.28",
        headers: { authorization: `Bearer ${admin.accessToken}` }
      });
      const adminList = expectResponseData(
        adminListResponse,
        adminBibleVerseNoteListResponseSchema,
        "admin list after delete"
      );
      expect(adminList.items.map((note) => note.id)).not.toContain(created.id);

      const deletedAdminListResponse = await app.inject({
        method: "GET",
        url: "/v1/admin/bible/verse-notes?verseId=rom.8.28&status=deleted",
        headers: { authorization: `Bearer ${admin.accessToken}` }
      });
      const deletedAdminList = expectResponseData(
        deletedAdminListResponse,
        adminBibleVerseNoteListResponseSchema,
        "admin deleted list"
      );
      expect(deletedAdminList.items.map((note) => note.id)).toContain(
        created.id
      );
    } finally {
      await close();
    }
  });

  test("rejects missing authors and mismatched verse references", async () => {
    const { app, close } = await buildTestApp();
    try {
      const missingAuthorResponse = await app.inject({
        method: "POST",
        url: "/v1/bible/verse-notes",
        payload: {
          verseId: "rom.8.28",
          bookId: "rom",
          chapter: 8,
          verse: 28,
          content: "This should require an author."
        }
      });
      expect(missingAuthorResponse.statusCode).toBe(401);

      const invalidVerseResponse = await app.inject({
        method: "POST",
        url: "/v1/bible/verse-notes",
        headers: { "x-external-user-id": "ext_invalid_verse_reader" },
        payload: {
          verseId: "rom.8.29",
          bookId: "rom",
          chapter: 8,
          verse: 28,
          content: "This reference does not match the verse id."
        }
      });
      expect(invalidVerseResponse.statusCode).toBe(400);
    } finally {
      await close();
    }
  });

  test("rejects malformed external user ids", async () => {
    const { app, close } = await buildTestApp();
    try {
      const response = await app.inject({
        method: "POST",
        url: "/v1/bible/verse-notes",
        headers: { "x-external-user-id": "reader_without_prefix" },
        payload: {
          verseId: "rom.8.28",
          bookId: "rom",
          chapter: 8,
          verse: 28,
          content: "This should not be accepted.",
          externalDisplayName: "Guest Reader"
        }
      });
      expect(response.statusCode).toBe(401);
    } finally {
      await close();
    }
  });

  test("treats an expired member token as a guest on public verse notes", async () => {
    const { app, close } = await buildTestApp();
    try {
      const createResponse = await app.inject({
        method: "POST",
        url: "/v1/bible/verse-notes",
        headers: { "x-external-user-id": "ext_public_note_reader" },
        payload: {
          verseId: "rom.8.28",
          bookId: "rom",
          chapter: 8,
          verse: 28,
          content: "Public content remains available after a session expires."
        }
      });
      expect(createResponse.statusCode).toBe(200);

      const response = await app.inject({
        method: "GET",
        url: "/v1/bible/verse-notes?verseId=rom.8.28",
        headers: { authorization: "Bearer expired-member-session" }
      });
      expect(response.statusCode).toBe(200);
      const notes = expectResponseData(
        response,
        bibleVerseNoteListResponseSchema,
        "public verse notes after expired member session"
      );
      expect(notes.items).toHaveLength(1);
      expect(notes.items[0]?.isMine).toBe(false);
    } finally {
      await close();
    }
  });

  test("lets admins hide and restore shared verse notes", async () => {
    const { app, close } = await buildTestApp();
    try {
      const admin = await login(app);
      const createResponse = await app.inject({
        method: "POST",
        url: "/v1/bible/verse-notes",
        headers: { "x-external-user-id": "ext_visible_reader" },
        payload: {
          verseId: "jhn.15.5",
          bookId: "jhn",
          chapter: 15,
          verse: 5,
          content: "Abiding in Christ is the center.",
          externalDisplayName: "Visitor"
        }
      });
      const created = expectResponseData(
        createResponse,
        bibleVerseNoteSchema,
        "create note for moderation"
      );

      const adminListResponse = await app.inject({
        method: "GET",
        url: "/v1/admin/bible/verse-notes?verseId=jhn.15.5",
        headers: { authorization: `Bearer ${admin.accessToken}` }
      });
      expect(adminListResponse.statusCode).toBe(200);
      const adminList = expectResponseData(
        adminListResponse,
        adminBibleVerseNoteListResponseSchema,
        "admin list bible verse notes"
      );
      expect(adminList.items.map((note) => note.id)).toContain(created.id);

      const hideResponse = await app.inject({
        method: "PATCH",
        url: `/v1/admin/bible/verse-notes/${created.id}/hide`,
        headers: { authorization: `Bearer ${admin.accessToken}` },
        payload: { hiddenReason: "Test moderation" }
      });
      expect(hideResponse.statusCode).toBe(200);

      const repeatHideResponse = await app.inject({
        method: "PATCH",
        url: `/v1/admin/bible/verse-notes/${created.id}/hide`,
        headers: { authorization: `Bearer ${admin.accessToken}` },
        payload: { hiddenReason: "Already hidden" }
      });
      expect(repeatHideResponse.statusCode).toBe(404);

      const authorRestoreAttempt = await app.inject({
        method: "PATCH",
        url: `/v1/bible/verse-notes/${created.id}`,
        headers: { "x-external-user-id": "ext_visible_reader" },
        payload: { content: "Trying to restore a hidden note." }
      });
      expect(authorRestoreAttempt.statusCode).toBe(404);

      const publicListAfterHide = await app.inject({
        method: "GET",
        url: "/v1/bible/verse-notes?verseId=jhn.15.5"
      });
      const hiddenList = expectResponseData(
        publicListAfterHide,
        bibleVerseNoteListResponseSchema,
        "public list after hide"
      );
      expect(hiddenList.items).toHaveLength(0);

      const restoreResponse = await app.inject({
        method: "PATCH",
        url: `/v1/admin/bible/verse-notes/${created.id}/restore`,
        headers: { authorization: `Bearer ${admin.accessToken}` },
        payload: {}
      });
      expect(restoreResponse.statusCode).toBe(200);

      const auditResponse = await app.inject({
        method: "GET",
        url: "/v1/admin/audit-logs?resourceType=bible_verse_note&limit=20",
        headers: { authorization: `Bearer ${admin.accessToken}` }
      });
      expect(auditResponse.statusCode).toBe(200);
      const audit = expectResponseData(
        auditResponse,
        auditLogListResponseSchema,
        "bible verse note audit"
      );
      expect(audit.items.map((item) => item.action)).toEqual(
        expect.arrayContaining([
          "bible_verse_note.hide",
          "bible_verse_note.restore"
        ])
      );
      expect(JSON.stringify(auditResponse.json())).not.toContain(
        "Abiding in Christ"
      );
      expect(JSON.stringify(auditResponse.json())).not.toContain(
        "Test moderation"
      );

      const repeatRestoreResponse = await app.inject({
        method: "PATCH",
        url: `/v1/admin/bible/verse-notes/${created.id}/restore`,
        headers: { authorization: `Bearer ${admin.accessToken}` },
        payload: {}
      });
      expect(repeatRestoreResponse.statusCode).toBe(404);
    } finally {
      await close();
    }
  });
});
