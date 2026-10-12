import type { Sermon, UpdateSermonRequest } from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { InMemorySermonRepository } from "../src/modules/sermons/in-memory-sermon.repository.js";
import { SermonAudioStorageService } from "../src/modules/sermons/sermon-audio-storage.service.js";
import { InMemorySermonAudioCleanupRepository } from "../src/modules/sermons/in_memory_sermon_audio_cleanup.repository.js";
import type {
  SermonAudioInput,
  SermonUpdateOptions
} from "../src/modules/sermons/sermon.repository.js";
import { SermonService } from "../src/modules/sermons/sermon.service.js";
import { SermonAudioCleanupService } from "../src/modules/sermons/sermon_audio_cleanup.service.js";

describe("SermonService", () => {
  it("revalidates the canonical sermon after a concurrent publish change", async () => {
    const repository = new StaleOnceSermonRepository();
    const sermon = await repository.createDraft({
      title: "Concurrent Publish",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });
    await repository.attachAudio(sermon.id, {
      storagePath: "local:/tmp/concurrent-publish.mp3",
      url: `/v1/sermons/${sermon.id}/audio`,
      fileName: "concurrent-publish.mp3",
      mimeType: "audio/mpeg",
      sizeBytes: 128,
      uploadedAt: new Date()
    });
    const ready = await repository.update(sermon.id, {
      transcript: {
        text: "Reviewed transcript.",
        source: "manual",
        updatedAt: null
      },
      outline: [
        {
          title: "Opening",
          summary: "Reviewed outline.",
          startSeconds: 0
        }
      ],
      references: [
        {
          reference: "John 15:5",
          verseId: "jhn.15.5",
          note: "Main text",
          startSeconds: 30
        }
      ]
    });
    repository.removeTranscriptBeforeNextGuardedUpdate = true;
    const service = new SermonService(
      repository,
      unusedAudioStorage,
      cleanupServiceFor(unusedAudioStorage)
    );

    await expect(
      service.publish(sermon.id, mutationContext(ready!, true))
    ).rejects.toMatchObject({
      code: "review_required",
      evidence: {
        sermonId: sermon.id,
        missing: expect.arrayContaining(["transcript"])
      }
    });
    expect((await repository.getById(sermon.id))?.status).toBe("draft");
  });

  it("removes a newly stored object when the sermon changes before audio binding", async () => {
    const cleanupRepository = new InMemorySermonAudioCleanupRepository();
    const repository = new StaleAttachSermonRepository(cleanupRepository);
    const sermon = await repository.createDraft({
      title: "Concurrent Audio",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });
    repository.changeBeforeNextGuardedAttach = true;
    const deletedPaths: string[] = [];
    const storage = new SermonAudioStorageService({
      saveAudio: async (input) => ({
        storagePath: `memory:${input.sermonId}/${input.fileName}`,
        url: `/v1/sermons/${input.sermonId}/audio`,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.length,
        uploadedAt: new Date()
      }),
      deleteAudio: async (storagePath) => {
        if (storagePath) {
          deletedPaths.push(storagePath);
        }
      },
      readAudio: () => Promise.reject(new Error("not used"))
    });
    const cleanupService = new SermonAudioCleanupService(
      cleanupRepository,
      storage
    );
    const service = new SermonService(repository, storage, cleanupService);

    await expect(
      service.attachAudio(sermon.id, {
        buffer: Buffer.from("audio"),
        fileName: "sermon.mp3",
        mimeType: "audio/mpeg"
      }, mutationContext(sermon))
    ).rejects.toMatchObject({ code: "sermon_state_changed" });

    expect(deletedPaths).toEqual([`memory:${sermon.id}/sermon.mp3`]);
    expect(await repository.getAudioRecord(sermon.id)).toBeNull();
    expect(await cleanupService.list({ status: "succeeded", limit: 50 })).toEqual([
      expect.objectContaining({
        sermonId: sermon.id,
        reason: "unbound_upload",
        attempts: 1
      })
    ]);
  });

  it("deletes a new object when its cleanup candidate cannot be persisted", async () => {
    const cleanupRepository = new FailingScheduleCleanupRepository();
    const repository = new InMemorySermonRepository(cleanupRepository);
    const sermon = await repository.createDraft({
      title: "Candidate persistence",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });
    const deletedPaths: string[] = [];
    const storage = new SermonAudioStorageService({
      saveAudio: async (input) => ({
        storagePath: `memory:${input.sermonId}/${input.fileName}`,
        url: `/v1/sermons/${input.sermonId}/audio`,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.length,
        uploadedAt: new Date()
      }),
      deleteAudio: async (storagePath) => {
        if (storagePath) {
          deletedPaths.push(storagePath);
        }
      },
      readAudio: () => Promise.reject(new Error("not used"))
    });
    const service = new SermonService(
      repository,
      storage,
      new SermonAudioCleanupService(cleanupRepository, storage)
    );

    await expect(
      service.attachAudio(
        sermon.id,
        audioUpload("candidate.mp3"),
        mutationContext(sermon)
      )
    ).rejects.toThrow("cleanup persistence unavailable");
    expect(deletedPaths).toEqual([
      `memory:${sermon.id}/candidate.mp3`
    ]);
    expect(await repository.getAudioRecord(sermon.id)).toBeNull();
  });

  it("rechecks published-content permission after a concurrent publish", async () => {
    const repository = new PublishBeforeUpdateSermonRepository();
    const sermon = await repository.createDraft({
      title: "Permission Race",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });
    repository.publishBeforeNextGuardedUpdate = true;
    const service = new SermonService(
      repository,
      unusedAudioStorage,
      cleanupServiceFor(unusedAudioStorage)
    );

    await expect(
      service.update(
        sermon.id,
        { summary: "Unauthorized live edit." },
        mutationContext(sermon)
      )
    ).rejects.toMatchObject({
      code: "publish_permission_denied",
      evidence: { sermonId: sermon.id }
    });
    expect((await repository.getById(sermon.id))?.summary).toBeNull();
  });

  it("does not overwrite a concurrent admin edit", async () => {
    const repository = new ConcurrentEditSermonRepository();
    const sermon = await repository.createDraft({
      title: "Concurrent Edit",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });
    repository.editBeforeNextGuardedUpdate = true;
    const service = new SermonService(
      repository,
      unusedAudioStorage,
      cleanupServiceFor(unusedAudioStorage)
    );

    await expect(
      service.update(
        sermon.id,
        { summary: "Stale request edit." },
        mutationContext(sermon)
      )
    ).rejects.toMatchObject({ code: "sermon_state_changed" });
    expect((await repository.getById(sermon.id))?.summary).toBe(
      "Concurrent canonical edit."
    );
  });

  it("preserves a replacement and retries failed old-audio cleanup", async () => {
    const cleanupRepository = new InMemorySermonAudioCleanupRepository();
    const repository = new InMemorySermonRepository(cleanupRepository);
    let saveCount = 0;
    let deletionFails = true;
    const deletedPaths: string[] = [];
    const storage = new SermonAudioStorageService({
      saveAudio: async (input) => ({
        storagePath: `memory:${input.sermonId}/${++saveCount}-${input.fileName}`,
        url: `/v1/sermons/${input.sermonId}/audio`,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.length,
        uploadedAt: new Date()
      }),
      deleteAudio: async (storagePath) => {
        if (storagePath) {
          deletedPaths.push(storagePath);
        }
        if (deletionFails) {
          throw new Error("storage unavailable");
        }
      },
      readAudio: () => Promise.reject(new Error("not used"))
    });
    const cleanupService = new SermonAudioCleanupService(
      cleanupRepository,
      storage
    );
    const service = new SermonService(repository, storage, cleanupService);
    const sermon = await repository.createDraft({
      title: "Replace audio",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });

    const first = await service.attachAudio(
      sermon.id,
      audioUpload("first.mp3"),
      mutationContext(sermon)
    );
    const replaced = await service.attachAudio(
      sermon.id,
      audioUpload("second.mp3"),
      mutationContext(first!)
    );

    expect(replaced?.audio.fileName).toBe("second.mp3");
    expect((await repository.getAudioRecord(sermon.id))?.storagePath).toContain(
      "2-second.mp3"
    );
    const [failed] = await cleanupService.list({ status: "failed", limit: 50 });
    expect(failed).toMatchObject({
      sermonId: sermon.id,
      reason: "audio_replaced",
      attempts: 1,
      status: "failed"
    });
    expect(failed).not.toHaveProperty("storagePath");
    expect(await cleanupService.list({ limit: 50 })).toHaveLength(1);

    deletionFails = false;
    const retried = await cleanupService.retry(failed!.id);

    expect(retried).toMatchObject({ status: "succeeded", attempts: 2 });
    expect(deletedPaths).toEqual([
      `memory:${sermon.id}/1-first.mp3`,
      `memory:${sermon.id}/1-first.mp3`
    ]);
  });

  it("tracks cleanup after audio removal and sermon deletion", async () => {
    const cleanupRepository = new InMemorySermonAudioCleanupRepository();
    const repository = new InMemorySermonRepository(cleanupRepository);
    let saveCount = 0;
    const storage = new SermonAudioStorageService({
      saveAudio: async (input) => ({
        storagePath: `memory:${input.sermonId}/${++saveCount}-${input.fileName}`,
        url: `/v1/sermons/${input.sermonId}/audio`,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.length,
        uploadedAt: new Date()
      }),
      deleteAudio: () => Promise.reject(new Error("storage unavailable")),
      readAudio: () => Promise.reject(new Error("not used"))
    });
    const cleanupService = new SermonAudioCleanupService(
      cleanupRepository,
      storage
    );
    const service = new SermonService(repository, storage, cleanupService);
    const sermon = await repository.createDraft({
      title: "Remove audio",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });

    const first = await service.attachAudio(
      sermon.id,
      audioUpload("remove.mp3"),
      mutationContext(sermon)
    );
    const removed = await service.removeAudio(
      sermon.id,
      mutationContext(first!)
    );
    expect(removed?.audio.status).toBe("missing");

    const second = await service.attachAudio(
      sermon.id,
      audioUpload("delete.mp3"),
      mutationContext(removed!)
    );
    expect(
      await service.delete(sermon.id, mutationContext(second!))
    ).toBe(true);
    expect(await repository.getById(sermon.id)).toBeNull();

    const failed = await cleanupService.list({ status: "failed", limit: 50 });
    expect(failed.map((task) => task.reason).sort()).toEqual([
      "audio_removed",
      "sermon_deleted"
    ]);
  });

  it("keeps the canonical replacement when cleanup state persistence fails", async () => {
    const cleanupRepository = new FailingCompletionCleanupRepository();
    const repository = new InMemorySermonRepository(cleanupRepository);
    let saveCount = 0;
    const deletedPaths: string[] = [];
    const storage = new SermonAudioStorageService({
      saveAudio: async (input) => ({
        storagePath: `memory:${input.sermonId}/${++saveCount}-${input.fileName}`,
        url: `/v1/sermons/${input.sermonId}/audio`,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.length,
        uploadedAt: new Date()
      }),
      deleteAudio: async (storagePath) => {
        if (storagePath) {
          deletedPaths.push(storagePath);
        }
      },
      readAudio: () => Promise.reject(new Error("not used"))
    });
    const cleanupService = new SermonAudioCleanupService(
      cleanupRepository,
      storage
    );
    const service = new SermonService(repository, storage, cleanupService);
    const sermon = await repository.createDraft({
      title: "Cleanup persistence",
      speaker: "Pastor",
      sermonDate: "2026-07-12"
    });

    const first = await service.attachAudio(
      sermon.id,
      audioUpload("first.mp3"),
      mutationContext(sermon)
    );
    const replaced = await service.attachAudio(
      sermon.id,
      audioUpload("second.mp3"),
      mutationContext(first!)
    );

    expect(replaced?.audio.fileName).toBe("second.mp3");
    expect(deletedPaths).toEqual([`memory:${sermon.id}/1-first.mp3`]);
    expect(await cleanupService.list({ limit: 50 })).toEqual([
      expect.objectContaining({
        sermonId: sermon.id,
        reason: "audio_replaced",
        status: "pending",
        attempts: 0
      })
    ]);
  });
});

function audioUpload(fileName: string) {
  return {
    buffer: Buffer.from("audio"),
    fileName,
    mimeType: "audio/mpeg"
  };
}

function mutationContext(sermon: Sermon, canPublish = false) {
  return {
    canPublish,
    expectedRevision: sermon.revision
  };
}

function cleanupServiceFor(storage: SermonAudioStorageService) {
  return new SermonAudioCleanupService(
    new InMemorySermonAudioCleanupRepository(),
    storage
  );
}

class StaleOnceSermonRepository extends InMemorySermonRepository {
  removeTranscriptBeforeNextGuardedUpdate = false;

  override async update(
    id: string,
    input: UpdateSermonRequest,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    if (
      options.expectedRevision !== undefined &&
      this.removeTranscriptBeforeNextGuardedUpdate
    ) {
      this.removeTranscriptBeforeNextGuardedUpdate = false;
      await super.update(id, { transcript: null });
    }
    return super.update(id, input, options);
  }
}

class StaleAttachSermonRepository extends InMemorySermonRepository {
  changeBeforeNextGuardedAttach = false;

  override async attachAudio(
    id: string,
    input: SermonAudioInput,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    if (
      options.expectedRevision !== undefined &&
      this.changeBeforeNextGuardedAttach
    ) {
      this.changeBeforeNextGuardedAttach = false;
      await super.update(id, { summary: "Concurrent admin edit." });
    }
    return super.attachAudio(id, input, options);
  }
}

class PublishBeforeUpdateSermonRepository extends InMemorySermonRepository {
  publishBeforeNextGuardedUpdate = false;

  override async update(
    id: string,
    input: UpdateSermonRequest,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    if (
      options.expectedRevision !== undefined &&
      this.publishBeforeNextGuardedUpdate
    ) {
      this.publishBeforeNextGuardedUpdate = false;
      await super.update(id, { status: "published" });
    }
    return super.update(id, input, options);
  }
}

class ConcurrentEditSermonRepository extends InMemorySermonRepository {
  editBeforeNextGuardedUpdate = false;

  override async update(
    id: string,
    input: UpdateSermonRequest,
    options: SermonUpdateOptions = {}
  ): Promise<Sermon | null> {
    if (
      options.expectedRevision !== undefined &&
      this.editBeforeNextGuardedUpdate
    ) {
      this.editBeforeNextGuardedUpdate = false;
      await super.update(id, { summary: "Concurrent canonical edit." });
    }
    return super.update(id, input, options);
  }
}

class FailingCompletionCleanupRepository extends InMemorySermonAudioCleanupRepository {
  override completeAttempt(): Promise<never> {
    return Promise.reject(new Error("cleanup persistence unavailable"));
  }
}

class FailingScheduleCleanupRepository extends InMemorySermonAudioCleanupRepository {
  override schedule(): Promise<never> {
    return Promise.reject(new Error("cleanup persistence unavailable"));
  }
}

const unusedAudioStorage = new SermonAudioStorageService({
  saveAudio: () => Promise.reject(new Error("not used")),
  deleteAudio: () => Promise.resolve(),
  readAudio: () => Promise.reject(new Error("not used"))
});
