import { eq, sql } from "drizzle-orm";

import { buildApp } from "../app.js";
import { loadConfig, type AppConfig } from "../config/env.js";
import { AdminAuthService } from "../modules/admin/auth/admin-auth.service.js";
import { PostgresAdminAuthRepository } from "../modules/admin/auth/postgres-admin-auth.repository.js";
import { PostgresSermonRepository } from "../modules/sermons/postgres-sermon.repository.js";
import { SermonAudioStorageService } from "../modules/sermons/sermon-audio-storage.service.js";
import { PostgresSermonAudioCleanupRepository } from "../modules/sermons/postgres_sermon_audio_cleanup.repository.js";
import { SermonAudioCleanupService } from "../modules/sermons/sermon_audio_cleanup.service.js";
import { SermonService } from "../modules/sermons/sermon.service.js";
import { createManagedDb } from "../shared/db/client.js";
import { jobs, sermonAudioCleanupTasks } from "../shared/db/schema.js";

const config = {
  ...loadConfig(),
  useMockData: false,
  bootstrapDevAdmin: true,
  mediaUploadDir: process.env.MEDIA_UPLOAD_DIR ?? "uploads-smoke"
} satisfies AppConfig;

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required for Postgres smoke.");
}

const managed = createManagedDb(config.databaseUrl);
const { db } = managed;
const app = await buildApp(config);
const sermonAudioStorage = SermonAudioStorageService.fromConfig(config);
const sermonAudioCleanupRepository = new PostgresSermonAudioCleanupRepository(db);
const sermonService = new SermonService(
  new PostgresSermonRepository(db),
  sermonAudioStorage,
  new SermonAudioCleanupService(
    sermonAudioCleanupRepository,
    sermonAudioStorage
  )
);
let sermonId: string | null = null;
let sermonRevision: number | null = null;

try {
  const loginResponse = await app.inject({
    method: "POST",
    url: "/v1/admin/auth/login",
    payload: {
      email: config.devAdminEmail,
      password: config.devAdminPassword
    }
  });
  assertStatus(loginResponse.statusCode, 200, "admin login");
  const accessToken = loginResponse.json().data.accessToken as string;

  const createDraftResponse = await app.inject({
    method: "POST",
    url: "/v1/admin/sermons/local-drafts",
    headers: { authorization: `Bearer ${accessToken}` },
    payload: {
      title: `Postgres Smoke ${new Date().toISOString()}`,
      speaker: "Smoke Pastor",
      sermonDate: "2026-05-10",
      primaryReference: "Romans 8:28"
    }
  });
  assertStatus(createDraftResponse.statusCode, 200, "sermon draft");
  sermonId = createDraftResponse.json().data.id as string;
  sermonRevision = createDraftResponse.json().data.revision as number;

  const uploadResponse = await app.inject({
    method: "POST",
    url: `/v1/admin/sermons/${sermonId}/audio`,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "audio/mpeg",
      "x-file-name": encodeURIComponent("smoke.mp3"),
      "x-sermon-revision": String(sermonRevision)
    },
    payload: Buffer.from("smoke audio bytes")
  });
  assertStatus(uploadResponse.statusCode, 200, "audio upload");
  sermonRevision = uploadResponse.json().data.revision as number;

  const localPackageResponse = await app.inject({
    method: "POST",
    url: `/v1/admin/sermons/${sermonId}/local-package`,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "x-sermon-revision": String(sermonRevision)
    },
    payload: {
      summary: "Smoke summary from local sermon processing.",
      transcript: {
        text: "Romans 8:28 reminds the church that God works in all things.",
        source: "local-smoke",
        updatedAt: null
      },
      outline: [
        {
          title: "God works through all things",
          summary: "A smoke-test outline section prepared locally.",
          startSeconds: 0
        }
      ],
      references: [
        {
          reference: "Romans 8:28",
          verseId: "rom.8.28",
          note: "Primary sermon text",
          startSeconds: 0
        }
      ],
      reviewMarkdown: "# Smoke Sermon\n\nReviewed local package.",
      processingMetadata: {
        pipeline: "local-smoke",
        transcriptionProvider: "local-smoke"
      },
      submitForReview: true
    }
  });
  assertStatus(localPackageResponse.statusCode, 200, "local sermon package");
  sermonRevision = localPackageResponse.json().data.revision as number;

  const processedSermonResponse = await app.inject({
    method: "GET",
    url: `/v1/admin/sermons/${sermonId}`,
    headers: { authorization: `Bearer ${accessToken}` }
  });
  assertStatus(processedSermonResponse.statusCode, 200, "processed sermon");
  const processedSermon = processedSermonResponse.json().data;
  if (
    processedSermon.audio.status !== "ready" ||
    !processedSermon.transcript?.text ||
    processedSermon.outline.length === 0 ||
    processedSermon.references.length === 0
  ) {
    throw new Error("Smoke sermon processing did not produce expected assets.");
  }

  const publishedResponse = await app.inject({
    method: "PATCH",
    url: `/v1/admin/sermons/${sermonId}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "x-sermon-revision": String(sermonRevision)
    },
    payload: {
      status: "published"
    }
  });
  assertStatus(publishedResponse.statusCode, 200, "publish sermon");
  if (publishedResponse.json().data.status !== "published") {
    throw new Error("Smoke sermon was not published.");
  }

  const publicListResponse = await app.inject({
    method: "GET",
    url: "/v1/sermons?limit=20"
  });
  assertStatus(publicListResponse.statusCode, 200, "public sermon list");
  const found = publicListResponse
    .json()
    .data.items.some((item: { id: string }) => item.id === sermonId);
  if (!found) {
    throw new Error("Published smoke sermon was not visible publicly.");
  }

  const statsResponse = await app.inject({
    method: "GET",
    url: "/v1/admin/jobs/stats",
    headers: { authorization: `Bearer ${accessToken}` }
  });
  assertStatus(statsResponse.statusCode, 200, "jobs stats");

  console.log("postgres smoke complete", {
    sermonId,
    storageDriver: config.mediaStorageDriver,
    failedJobs: statsResponse.json().data.byStatus.failed
  });
} finally {
  if (sermonId) {
    await db.delete(jobs).where(eq(jobs.resourceId, sermonId));
    await db.execute(sql`delete from audit_logs where resource_id = ${sermonId}`);
    const sermon = await sermonService.getById(sermonId);
    if (sermon) {
      await sermonService.delete(sermonId, {
        canPublish: true,
        expectedRevision: sermon.revision
      });
    }
    await db
      .delete(sermonAudioCleanupTasks)
      .where(eq(sermonAudioCleanupTasks.sermonId, sermonId));
  }
  await app.close();
  await managed.close();
}

function assertStatus(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`${label} returned ${actual}, expected ${expected}.`);
  }
}
