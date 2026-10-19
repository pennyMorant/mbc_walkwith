import { describe, expect, it } from "vitest";

import type { MediaRepository } from "../src/modules/media/media.repository.js";
import { InMemoryMediaRepository } from "../src/modules/media/in-memory-media.repository.js";
import { InMemoryMediaCleanupRepository } from "../src/modules/media/in_memory_media_cleanup.repository.js";
import {
  MediaStorageService,
  type MediaStorageDriver
} from "../src/modules/media/media-storage.service.js";
import { MediaService } from "../src/modules/media/media.service.js";
import { MediaCleanupService } from "../src/modules/media/media_cleanup.service.js";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("MediaService", () => {
  it("consumes the cleanup candidate when metadata binding succeeds", async () => {
    const storage = new MediaStorageService({
      async put() {
        return { storageKey: "local:bound.png", publicUrl: null };
      },
      async read() {
        return null;
      },
      planRelocation() {
        throw new Error("not used");
      },
      async copyRelocation() {
        throw new Error("not used");
      },
      async delete() {}
    });
    const cleanupRepository = new InMemoryMediaCleanupRepository();
    const cleanupService = new MediaCleanupService(cleanupRepository, storage);
    const service = new MediaService(
      new InMemoryMediaRepository(cleanupRepository),
      storage,
      cleanupService
    );

    await service.uploadImage({
      buffer: onePixelPng,
      fileName: "bound.png",
      mimeType: "image/png",
      kind: "image",
      visibility: "private",
      consentStatus: "pending",
      altText: "",
      caption: "",
      copyrightSource: null
    });

    expect(await cleanupService.list({ limit: 50 })).toEqual([]);
  });

  it("removes a newly uploaded object when metadata persistence fails", async () => {
    const deleted: string[] = [];
    const storageDriver: MediaStorageDriver = {
      async put() {
        return {
          storageKey: "local:uncommitted.png",
          publicUrl: "http://localhost/media/uncommitted/content"
        };
      },
      async read() {
        return null;
      },
      planRelocation() {
        throw new Error("not used");
      },
      async copyRelocation() {
        throw new Error("not used");
      },
      async delete(storageKey) {
        deleted.push(storageKey);
      }
    };
    const repository: MediaRepository = {
      async create() {
        throw new Error("database unavailable");
      },
      async getById() {
        return null;
      },
      async getByIds() {
        return [];
      },
      async getStorageKey() {
        return null;
      },
      async list() {
        return [];
      },
      async update() {
        return null;
      }
    };
    const service = new MediaService(
      repository,
      new MediaStorageService(storageDriver),
      new MediaCleanupService(
        new InMemoryMediaCleanupRepository(),
        new MediaStorageService(storageDriver)
      )
    );

    await expect(
      service.uploadImage({
        buffer: onePixelPng,
        fileName: "uncommitted.png",
        mimeType: "image/png",
        kind: "image",
        visibility: "public",
        consentStatus: "approved",
        altText: "",
        caption: "",
        copyrightSource: null
      })
    ).rejects.toThrow("database unavailable");
    expect(deleted).toEqual(["local:uncommitted.png"]);
  });

  it("retains a retryable cleanup task when object deletion fails", async () => {
    let deletionShouldFail = true;
    const storage = new MediaStorageService({
      async put() {
        return { storageKey: "local:orphan.png", publicUrl: null };
      },
      async read() {
        return null;
      },
      planRelocation() {
        throw new Error("not used");
      },
      async copyRelocation() {
        throw new Error("not used");
      },
      async delete() {
        if (deletionShouldFail) throw new Error("storage unavailable");
      }
    });
    const cleanupRepository = new InMemoryMediaCleanupRepository();
    const cleanupService = new MediaCleanupService(cleanupRepository, storage);
    const repository = failingMediaRepository();
    const service = new MediaService(repository, storage, cleanupService);

    await expect(
      service.uploadImage({
        buffer: onePixelPng,
        fileName: "orphan.png",
        mimeType: "image/png",
        kind: "image",
        visibility: "private",
        consentStatus: "pending",
        altText: "",
        caption: "",
        copyrightSource: null
      })
    ).rejects.toThrow("database unavailable");

    const [failed] = await cleanupService.list({ status: "failed", limit: 50 });
    expect(failed).toMatchObject({
      reason: "unbound_upload",
      status: "failed",
      attempts: 1
    });
    expect(failed).not.toHaveProperty("storageKey");

    deletionShouldFail = false;
    const retried = await cleanupService.retry(failed!.id);
    expect(retried).toMatchObject({ status: "succeeded", attempts: 2 });
  });

  it("blocks active pending cleanup and permits stale recovery", async () => {
    const deleted: string[] = [];
    const storage = new MediaStorageService({
      async put() {
        throw new Error("not used");
      },
      async read() {
        return null;
      },
      planRelocation() {
        throw new Error("not used");
      },
      async copyRelocation() {
        throw new Error("not used");
      },
      async delete(storageKey) {
        deleted.push(storageKey);
      }
    });
    const repository = new InMemoryMediaCleanupRepository();
    const task = await repository.schedule({
      mediaAssetId: "00000000-0000-4000-8000-000000000001",
      storageKey: "local:active.png",
      reason: "unbound_upload"
    });
    const activeService = new MediaCleanupService(
      repository,
      storage,
      () => new Date(new Date(task.createdAt).getTime() + 60_000)
    );
    await expect(activeService.retry(task.id)).rejects.toMatchObject({
      code: "media_cleanup_not_ready"
    });
    expect(deleted).toEqual([]);
    expect((await activeService.list({ limit: 50 }))[0]?.retryable).toBe(false);

    const staleService = new MediaCleanupService(
      repository,
      storage,
      () => new Date(new Date(task.createdAt).getTime() + 16 * 60_000)
    );
    expect((await staleService.list({ limit: 50 }))[0]?.retryable).toBe(true);
    await expect(staleService.retry(task.id)).resolves.toMatchObject({
      status: "succeeded"
    });
    expect(deleted).toEqual(["local:active.png"]);
  });

  it("switches canonical storage before retrying old-source deletion", async () => {
    let sourceDeletionFails = true;
    const copied: string[] = [];
    const deleted: string[] = [];
    const storage = new MediaStorageService({
      async put(input) {
        return {
          storageKey: `s3:private:private/images/${input.id}.png`,
          publicUrl: null
        };
      },
      async read() {
        return null;
      },
      planRelocation(sourceStorageKey, input) {
        return {
          sourceStorageKey,
          storageKey: `s3:public:public/images/${input.id}.png`,
          publicUrl: `https://media.example/public/images/${input.id}.png`,
          requiresCopy: true
        };
      },
      async copyRelocation(plan) {
        copied.push(plan.storageKey);
      },
      async delete(storageKey) {
        deleted.push(storageKey);
        if (storageKey.startsWith("s3:private:") && sourceDeletionFails) {
          throw new Error("source deletion unavailable");
        }
      }
    });
    const cleanupRepository = new InMemoryMediaCleanupRepository();
    const cleanupService = new MediaCleanupService(cleanupRepository, storage);
    const mediaRepository = new InMemoryMediaRepository(cleanupRepository);
    const service = new MediaService(
      mediaRepository,
      storage,
      cleanupService
    );
    const uploaded = await service.uploadImage({
      buffer: onePixelPng,
      fileName: "relocate.png",
      mimeType: "image/png",
      kind: "image",
      visibility: "public",
      consentStatus: "pending",
      altText: "",
      caption: "",
      copyrightSource: null
    });

    const approved = await service.update(uploaded.id, {
      consentStatus: "approved"
    });
    expect(approved.url).toContain("https://media.example/public/images/");
    expect(copied).toHaveLength(1);
    const [failed] = await cleanupService.list({ status: "failed", limit: 50 });
    expect(failed).toMatchObject({
      mediaAssetId: uploaded.id,
      reason: "relocated_source",
      retryable: true
    });

    sourceDeletionFails = false;
    await cleanupService.retry(failed!.id);
    expect(deleted.filter((key) => key.startsWith("s3:private:"))).toHaveLength(2);
  });

  it("does not consume a cleanup candidate owned by another media asset", async () => {
    const cleanupRepository = new InMemoryMediaCleanupRepository();
    const task = await cleanupRepository.schedule({
      mediaAssetId: "00000000-0000-4000-8000-000000000001",
      storageKey: "local:shared.png",
      reason: "unbound_upload"
    });
    const repository = new InMemoryMediaRepository(cleanupRepository);

    await expect(
      repository.create(
        {
          id: "00000000-0000-4000-8000-000000000002",
          kind: "image",
          visibility: "private",
          consentStatus: "pending",
          storageKey: "local:shared.png",
          url: null,
          originalFileName: "shared.png",
          mimeType: "image/png",
          sizeBytes: onePixelPng.length,
          width: null,
          height: null,
          focalX: 50,
          focalY: 50,
          altText: "",
          caption: "",
          copyrightSource: null
        },
        task.id
      )
    ).rejects.toThrow("cleanup candidate was not found");
    expect(await cleanupRepository.getById(task.id)).not.toBeNull();
  });
});

function failingMediaRepository(): MediaRepository {
  return {
    async create() {
      throw new Error("database unavailable");
    },
    async getById() {
      return null;
    },
    async getByIds() {
      return [];
    },
    async getStorageKey() {
      return null;
    },
    async list() {
      return [];
    },
    async update() {
      return null;
    },
    async relocate() {
      return null;
    }
  };
}
