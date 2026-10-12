import {
  adminBibleVerseNoteHideRequestSchema,
  adminBibleVerseNoteListQuerySchema,
  bibleVerseNoteCreateRequestSchema,
  bibleVerseNoteListQuerySchema,
  bibleVerseNoteUpdateRequestSchema
} from "@mbc/api-contracts";
import type { AdminPermission } from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { AuditService } from "../audit/audit.service.js";
import {
  optionalMember
} from "../members/auth/member-auth.middleware.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import { ok } from "../../shared/http/api-response.js";
import { externalUserIdFromRequest } from "../../shared/http/external-user-id.js";
import type { BibleVerseNoteAuthor } from "./bible-verse-note.repository.js";
import {
  BibleVerseNoteService,
  requireVerseNoteAuthor
} from "./bible-verse-note.service.js";

type PermissionPreHandler = (
  permission: AdminPermission
) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

export async function registerBibleVerseNoteRoutes(
  app: FastifyInstance,
  service: BibleVerseNoteService,
  memberAuthService: MemberAuthService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/bible/verse-notes",
    { preHandler: optionalMember(memberAuthService) },
    async (request) => {
      const query = bibleVerseNoteListQuerySchema.parse(request.query);
      const viewer = verseNoteAuthorFromRequest(request);
      return ok({ items: await service.listPublished(query, viewer ?? undefined) });
    }
  );

  app.post(
    "/v1/bible/verse-notes",
    { preHandler: optionalMember(memberAuthService) },
    async (request) => {
      const body = bibleVerseNoteCreateRequestSchema.parse(request.body);
      const author = requireVerseNoteAuthor(
        verseNoteAuthorFromRequest(request, body.externalDisplayName)
      );
      return ok(await service.create(body, author));
    }
  );

  app.patch(
    "/v1/bible/verse-notes/:noteId",
    { preHandler: optionalMember(memberAuthService) },
    async (request) => {
      const { noteId } = noteParams(request);
      const body = bibleVerseNoteUpdateRequestSchema.parse(request.body);
      const author = requireVerseNoteAuthor(verseNoteAuthorFromRequest(request));
      return ok(await service.update(noteId, body, author));
    }
  );

  app.delete(
    "/v1/bible/verse-notes/:noteId",
    { preHandler: optionalMember(memberAuthService) },
    async (request) => {
      const { noteId } = noteParams(request);
      const author = requireVerseNoteAuthor(verseNoteAuthorFromRequest(request));
      return ok(await service.delete(noteId, author));
    }
  );

  app.get(
    "/v1/admin/bible/verse-notes",
    { preHandler: permissionPreHandler("bible_notes:read") },
    async (request) => {
      const query = adminBibleVerseNoteListQuerySchema.parse(request.query);
      return ok({ items: await service.listAdmin(query) });
    }
  );

  app.patch(
    "/v1/admin/bible/verse-notes/:noteId/hide",
    { preHandler: permissionPreHandler("bible_notes:moderate") },
    async (request) => {
      const { noteId } = noteParams(request);
      const body = adminBibleVerseNoteHideRequestSchema.parse(request.body);
      const note = await service.hide(noteId, body, request.adminUser?.id);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "bible_verse_note.hide",
        resourceType: "bible_verse_note",
        resourceId: note.id,
        afterJson: auditSnapshot(note)
      });
      return ok(note);
    }
  );

  app.patch(
    "/v1/admin/bible/verse-notes/:noteId/restore",
    { preHandler: permissionPreHandler("bible_notes:moderate") },
    async (request) => {
      const { noteId } = noteParams(request);
      const note = await service.restore(noteId);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "bible_verse_note.restore",
        resourceType: "bible_verse_note",
        resourceId: note.id,
        afterJson: auditSnapshot(note)
      });
      return ok(note);
    }
  );
}

function verseNoteAuthorFromRequest(
  request: FastifyRequest,
  externalDisplayName?: string
): BibleVerseNoteAuthor | null {
  if (request.member) {
    return {
      type: "member",
      memberUserId: request.member.id,
      displayName: request.member.displayName
    };
  }
  const externalUserId = externalUserIdFromRequest(request);
  if (!externalUserId) {
    return null;
  }
  return {
    type: "external",
    externalUserId,
    displayName: externalDisplayName?.trim() || "访客"
  };
}

function noteParams(request: FastifyRequest) {
  const params = request.params as { noteId?: string };
  return { noteId: params.noteId ?? "" };
}

function auditSnapshot(note: {
  id: string;
  verseId: string;
  status: string;
  authorType: string;
}) {
  return {
    id: note.id,
    verseId: note.verseId,
    status: note.status,
    authorType: note.authorType
  };
}
